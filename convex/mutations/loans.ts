import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation, mutation } from "../_generated/server";

async function notifyUser(ctx: any, userId: any, title: string, body: string) {
  await ctx.db.insert("notifications", { userId, title, body, read: false, createdAt: Date.now() });
  const user = await ctx.db.get(userId);
  if (user?.pushToken) {
    await ctx.scheduler.runAfter(0, internal.actions.notifications.sendPushNotification, {
      pushToken: user.pushToken,
      title,
      body,
    });
  }
}

const MONTHLY_INTEREST_RATE = 0.02; // 2% per month

export const applyForLoan = mutation({
  args: {
    accountId: v.id("accounts"),
    product: v.union(
      v.literal("SMALL_LOAN"),
      v.literal("INDIVIDUAL_LOAN"),
      v.literal("SME_LOAN"),
      v.literal("EDUCATION_LOAN"),
      v.literal("ASSET_FINANCING"),
    ),
    principal: v.number(),
    term: v.number(),
    purpose: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new Error("User not found");

    if (!user.isVerified) throw new Error("Your identity must be verified before applying for a loan. Complete KYC from your profile.");

    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== user._id) throw new Error("Account not found");

    if (args.principal < 100) throw new Error("Minimum loan amount is GHS 100");
    if (args.term < 1 || args.term > 60) throw new Error("Loan term must be between 1 and 60 months");
    if (!args.purpose.trim()) throw new Error("Loan purpose is required");

    const totalInterest = args.principal * MONTHLY_INTEREST_RATE * args.term;
    const totalAmount = args.principal + totalInterest;
    const loanNumber = `LN${Date.now().toString().slice(-8)}`;

    const loanId = await ctx.db.insert("loans", {
      loanNumber,
      userId: user._id,
      accountId: args.accountId,
      product: args.product,
      principal: args.principal,
      interestRate: MONTHLY_INTEREST_RATE,
      totalInterest,
      totalAmount,
      term: args.term,
      purpose: args.purpose,
      status: "PENDING",
      applicationDate: Date.now(),
      createdAt: Date.now(),
    });

    return { loanId, loanNumber, totalAmount };
  },
});

// ─── Repayment ────────────────────────────────────────────────────────────────

export const initiateRepayment = mutation({
  args: {
    loanId: v.id("loans"),
    amount: v.number(),
    method: v.union(
      v.literal("MTN_MOMO"),
      v.literal("VODAFONE_CASH"),
      v.literal("AIRTELTIGO_MONEY"),
    ),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new Error("User not found");

    const loan = await ctx.db.get(args.loanId);
    if (!loan || loan.userId !== user._id) throw new Error("Loan not found");
    if (loan.status !== "ACTIVE" && loan.status !== "DISBURSED")
      throw new Error("Loan is not currently repayable");

    const monthlyPayment = loan.totalAmount / loan.term;
    if (args.amount < 1) throw new Error("Minimum repayment is GHS 1");

    const reference = `REP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const repaymentId = await ctx.db.insert("loanRepayments", {
      loanId: args.loanId,
      userId: user._id,
      amount: args.amount,
      principalPaid: args.amount * (loan.principal / loan.totalAmount),
      interestPaid: args.amount * (loan.totalInterest / loan.totalAmount),
      dueDate: Date.now(),
      status: "PENDING",
      method: args.method,
      reference,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.actions.payments.processRepayment, {
      repaymentId,
      amount: args.amount,
      method: args.method,
      phoneNumber: args.phoneNumber,
      reference,
      email: identity.email!,
    });

    return { repaymentId, reference, status: "PENDING" };
  },
});

export const completeRepayment = internalMutation({
  args: {
    repaymentId: v.id("loanRepayments"),
    externalReference: v.string(),
  },
  handler: async (ctx, args) => {
    const repayment = await ctx.db.get(args.repaymentId);
    if (!repayment || repayment.status !== "PENDING") return;

    await ctx.db.patch(args.repaymentId, {
      status: "PAID",
      paidDate: Date.now(),
    });

    // Check if loan is fully repaid
    const loan = await ctx.db.get(repayment.loanId);
    if (!loan) return;

    const allRepayments = await ctx.db
      .query("loanRepayments")
      .withIndex("by_loanId", (q) => q.eq("loanId", repayment.loanId))
      .collect();

    const totalPaid = allRepayments
      .filter((r) => r.status === "PAID")
      .reduce((sum, r) => sum + r.amount, 0);

    if (totalPaid >= loan.totalAmount) {
      await ctx.db.patch(repayment.loanId, { status: "COMPLETED" });
      await notifyUser(
        ctx,
        repayment.userId,
        "Loan Fully Repaid",
        `Congratulations! Your loan ${loan.loanNumber} has been fully repaid.`,
      );
    } else {
      await notifyUser(
        ctx,
        repayment.userId,
        "Repayment Received",
        `GHS ${repayment.amount.toFixed(2)} payment received. Remaining: GHS ${(loan.totalAmount - totalPaid).toFixed(2)}.`,
      );
    }
  },
});

export const failRepayment = internalMutation({
  args: {
    repaymentId: v.id("loanRepayments"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const repayment = await ctx.db.get(args.repaymentId);
    if (!repayment || repayment.status !== "PENDING") return;
    await ctx.db.patch(args.repaymentId, { status: "PENDING" }); // stays pending, user can retry
  },
});

export const sendRepaymentReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const activeLoans = await ctx.db
      .query("loans")
      .withIndex("by_status", (q) => q.eq("status", "ACTIVE"))
      .collect();

    for (const loan of activeLoans) {
      if (!loan.firstRepaymentDate) continue;

      const repayments = await ctx.db
        .query("loanRepayments")
        .withIndex("by_loanId", (q) => q.eq("loanId", loan._id))
        .collect();

      const paidCount = repayments.filter((r) => r.status === "PAID").length;
      const nextDue = loan.firstRepaymentDate + paidCount * 30 * dayMs;
      const daysUntil = Math.round((nextDue - now) / dayMs);

      if (daysUntil === 7 || daysUntil === 1) {
        const monthly = (loan.totalAmount / loan.term).toFixed(2);
        const dueStr = new Date(nextDue).toLocaleDateString("en-GH", {
          day: "numeric", month: "short", year: "numeric",
        });
        await notifyUser(
          ctx,
          loan.userId,
          daysUntil === 1 ? "Repayment Due Tomorrow" : "Repayment Due in 7 Days",
          `Your next payment of GHS ${monthly} for loan ${loan.loanNumber} is due on ${dueStr}.`,
        );
      }
    }
  },
});

export const markDefaultedLoans = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const gracePeriodMs = 30 * 24 * 60 * 60 * 1000; // 30 days grace after first repayment due

    const activeLoans = await ctx.db
      .query("loans")
      .withIndex("by_status", (q) => q.eq("status", "ACTIVE"))
      .collect();

    for (const loan of activeLoans) {
      if (!loan.firstRepaymentDate) continue;
      // Not yet past the grace period
      if (now < loan.firstRepaymentDate + gracePeriodMs) continue;

      const repayments = await ctx.db
        .query("loanRepayments")
        .withIndex("by_loanId", (q) => q.eq("loanId", loan._id))
        .collect();

      const totalPaid = repayments
        .filter((r) => r.status === "PAID")
        .reduce((sum, r) => sum + r.amount, 0);

      const monthlyPayment = loan.totalAmount / loan.term;
      if (totalPaid < monthlyPayment * 0.5) {
        await ctx.db.patch(loan._id, { status: "DEFAULTED" });
        await notifyUser(
          ctx,
          loan.userId,
          "Loan Defaulted",
          `Your loan ${loan.loanNumber} has been marked as defaulted due to missed payments. Please contact us immediately.`,
        );
      }
    }
  },
});

export const completeRepaymentByReference = internalMutation({
  args: {
    reference: v.string(),
    externalReference: v.string(),
  },
  handler: async (ctx, args) => {
    const repayment = await ctx.db
      .query("loanRepayments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();
    if (!repayment || repayment.status !== "PENDING") return;

    await ctx.db.patch(repayment._id, {
      status: "PAID",
      paidDate: Date.now(),
    });

    const loan = await ctx.db.get(repayment.loanId);
    if (!loan) return;

    const allRepayments = await ctx.db
      .query("loanRepayments")
      .withIndex("by_loanId", (q) => q.eq("loanId", repayment.loanId))
      .collect();

    const totalPaid = allRepayments
      .filter((r) => r.status === "PAID")
      .reduce((sum, r) => sum + r.amount, 0);

    if (totalPaid >= loan.totalAmount) {
      await ctx.db.patch(repayment.loanId, { status: "COMPLETED" });
    }
  },
});
