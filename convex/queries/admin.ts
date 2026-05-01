import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { QueryCtx } from "../_generated/server";

async function requireAdminOrAgent(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .first();
  if (!user) throw new Error("User not found");
  if (user.role !== "ADMIN" && user.role !== "AGENT")
    throw new Error("Unauthorized");

  return user;
}

async function requireAdmin(ctx: QueryCtx) {
  const user = await requireAdminOrAgent(ctx);
  if (user.role !== "ADMIN") throw new Error("Unauthorized — must be ADMIN");
  return user;
}

// Used by the inviteStaff action to verify the caller's role server-side.
export const getCallerForAuth = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
  },
});

export const getLoansByStatus = query({
  args: {
    status: v.union(
      v.literal("PENDING"),
      v.literal("APPROVED"),
      v.literal("DISBURSED"),
      v.literal("ACTIVE"),
      v.literal("COMPLETED"),
      v.literal("DEFAULTED"),
      v.literal("REJECTED"),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdminOrAgent(ctx);

    const loans = await ctx.db
      .query("loans")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(50);

    return await Promise.all(
      loans.map(async (loan) => {
        const user = await ctx.db.get(loan.userId);
        return {
          ...loan,
          userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          userEmail: user?.email ?? "",
          userPhone: user?.phone ?? null,
        };
      }),
    );
  },
});

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdminOrAgent(ctx);

    const [pending, approved, active, completed, defaulted, paidRepayments, kycPending] = await Promise.all([
      ctx.db.query("loans").withIndex("by_status", (q) => q.eq("status", "PENDING")).take(200),
      ctx.db.query("loans").withIndex("by_status", (q) => q.eq("status", "APPROVED")).take(200),
      ctx.db.query("loans").withIndex("by_status", (q) => q.eq("status", "ACTIVE")).take(200),
      ctx.db.query("loans").withIndex("by_status", (q) => q.eq("status", "COMPLETED")).take(200),
      ctx.db.query("loans").withIndex("by_status", (q) => q.eq("status", "DEFAULTED")).take(200),
      ctx.db.query("loanRepayments").withIndex("by_status", (q) => q.eq("status", "PAID")).take(500),
      ctx.db.query("kycDocuments").withIndex("by_status", (q) => q.eq("status", "PENDING")).take(200),
    ]);

    const totalDisbursed = active.reduce((s, l) => s + l.principal, 0)
      + completed.reduce((s, l) => s + l.principal, 0)
      + defaulted.reduce((s, l) => s + l.principal, 0);

    const totalCollected = paidRepayments.reduce((s, r) => s + r.amount, 0);

    return {
      pendingCount: pending.length,
      approvedCount: approved.length,
      activeCount: active.length,
      completedCount: completed.length,
      defaultedCount: defaulted.length,
      kycPendingCount: kycPending.length,
      totalDisbursedPrincipal: totalDisbursed,
      totalCollected,
    };
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").order("desc").take(200);

    return await Promise.all(
      users.map(async (user) => {
        const accounts = await ctx.db
          .query("accounts")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .take(10);
        const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
        return { ...user, accountCount: accounts.length, totalBalance };
      }),
    );
  },
});

export const getAllTransactions = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const transactions = await ctx.db.query("transactions").order("desc").take(100);

    return await Promise.all(
      transactions.map(async (tx) => {
        const user = await ctx.db.get(tx.userId);
        const account = await ctx.db.get(tx.accountId);
        return {
          ...tx,
          userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          userEmail: user?.email ?? "",
          accountNumber: account?.accountNumber ?? "",
        };
      }),
    );
  },
});

export const getLoanById = query({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => {
    await requireAdminOrAgent(ctx);

    const loan = await ctx.db.get(args.loanId);
    if (!loan) return null;

    const user = await ctx.db.get(loan.userId);
    const repayments = await ctx.db
      .query("loanRepayments")
      .withIndex("by_loanId", (q) => q.eq("loanId", args.loanId))
      .order("desc")
      .take(50);

    return {
      ...loan,
      userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
      userEmail: user?.email ?? "",
      userPhone: user?.phone ?? null,
      repayments,
    };
  },
});
