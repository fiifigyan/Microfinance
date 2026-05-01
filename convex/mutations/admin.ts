import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation, mutation } from "../_generated/server";
import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

async function notifyUser(ctx: MutationCtx, userId: Id<"users">, title: string, body: string) {
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

async function requireAdminOrAgent(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .first();
  if (!user) throw new Error("User not found");
  if (user.role !== "ADMIN" && user.role !== "AGENT")
    throw new Error("Unauthorized — must be ADMIN or AGENT");

  return user;
}

async function requireAdmin(ctx: MutationCtx) {
  const user = await requireAdminOrAgent(ctx);
  if (user.role !== "ADMIN") throw new Error("Unauthorized — must be ADMIN");
  return user;
}

export const approveLoan = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => {
    await requireAdminOrAgent(ctx);

    const loan = await ctx.db.get(args.loanId);
    if (!loan) throw new Error("Loan not found");
    if (loan.status !== "PENDING") throw new Error(`Cannot approve a loan with status ${loan.status}`);

    await ctx.db.patch(args.loanId, {
      status: "APPROVED",
      approvalDate: Date.now(),
    });

    await notifyUser(
      ctx,
      loan.userId,
      "Loan Approved",
      `Your loan ${loan.loanNumber} for GHS ${loan.principal.toLocaleString("en-GH")} has been approved.`,
    );

    return { loanId: args.loanId, status: "APPROVED" };
  },
});

export const rejectLoan = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const loan = await ctx.db.get(args.loanId);
    if (!loan) throw new Error("Loan not found");
    if (loan.status !== "PENDING" && loan.status !== "APPROVED")
      throw new Error(`Cannot reject a loan with status ${loan.status}`);

    await ctx.db.patch(args.loanId, { status: "REJECTED" });

    await notifyUser(
      ctx,
      loan.userId,
      "Loan Application Update",
      `Your loan application ${loan.loanNumber} has been rejected. Contact us for more information.`,
    );

    return { loanId: args.loanId, status: "REJECTED" };
  },
});

export const disburseLoan = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => {
    await requireAdminOrAgent(ctx);

    const loan = await ctx.db.get(args.loanId);
    if (!loan) throw new Error("Loan not found");
    if (loan.status !== "APPROVED") throw new Error(`Cannot disburse a loan with status ${loan.status}`);

    const account = await ctx.db.get(loan.accountId);
    if (!account) throw new Error("Disbursement account not found");
    if (!account.isActive) throw new Error("Disbursement account is inactive");

    const now = Date.now();
    const firstRepaymentDate = now + 30 * 24 * 60 * 60 * 1000;

    await ctx.db.patch(loan.accountId, {
      balance: account.balance + loan.principal,
    });

    await ctx.db.patch(args.loanId, {
      status: "ACTIVE",
      disbursementDate: now,
      firstRepaymentDate,
    });

    await notifyUser(
      ctx,
      loan.userId,
      "Loan Disbursed",
      `GHS ${loan.principal.toLocaleString("en-GH")} has been credited to your account. First repayment due in 30 days.`,
    );

    return { loanId: args.loanId, status: "ACTIVE" };
  },
});

export const extendLoan = mutation({
  args: {
    loanId: v.id("loans"),
    newTerm: v.number(),
    newFirstRepaymentDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdminOrAgent(ctx);

    const loan = await ctx.db.get(args.loanId);
    if (!loan) throw new Error("Loan not found");
    if (loan.status !== "ACTIVE" && loan.status !== "DEFAULTED")
      throw new Error("Can only extend ACTIVE or DEFAULTED loans");
    if (args.newTerm < 1 || args.newTerm > 120)
      throw new Error("Term must be between 1 and 120 months");

    const repayments = await ctx.db
      .query("loanRepayments")
      .withIndex("by_loanId", (q) => q.eq("loanId", args.loanId))
      .collect();

    const totalPaid = repayments
      .filter((r) => r.status === "PAID")
      .reduce((sum, r) => sum + r.amount, 0);

    const remainingBalance = Math.max(0, loan.totalAmount - totalPaid);
    const newInterest = remainingBalance * loan.interestRate * args.newTerm;
    const newTotalAmount = remainingBalance + newInterest;

    await ctx.db.patch(args.loanId, {
      term: args.newTerm,
      totalInterest: newInterest,
      totalAmount: newTotalAmount,
      status: "ACTIVE" as const,
      ...(args.newFirstRepaymentDate !== undefined
        ? { firstRepaymentDate: args.newFirstRepaymentDate }
        : {}),
    });

    const monthly = (newTotalAmount / args.newTerm).toFixed(2);
    await notifyUser(
      ctx,
      loan.userId,
      "Loan Extended",
      `Your loan ${loan.loanNumber} has been extended to ${args.newTerm} months. New monthly payment: GHS ${monthly}.`,
    );

    return { loanId: args.loanId, newTotalAmount, newTerm: args.newTerm };
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("CUSTOMER"), v.literal("AGENT"), v.literal("ADMIN")),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    if (actor._id === args.userId) throw new Error("Cannot change your own role");

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");

    await ctx.db.patch(args.userId, { role: args.role });
    return { userId: args.userId, role: args.role };
  },
});

// Run once from the Convex dashboard to create the first admin.
// Idempotent: if the email already exists, it promotes them to ADMIN.
export const bootstrapAdmin = internalMutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { role: "ADMIN" });
      return { userId: existing._id, created: false };
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: "ADMIN",
      isVerified: false,
      createdAt: Date.now(),
    });

    return { userId, created: true };
  },
});

// Called internally by the inviteStaff action after the Clerk invite is sent.
export const preCreateStaffUser = internalMutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal("AGENT"), v.literal("ADMIN")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      isVerified: false,
      createdAt: Date.now(),
    });
  },
});
