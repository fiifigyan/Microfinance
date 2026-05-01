import { v } from "convex/values";
import { query } from "../_generated/server";

export const getLoanRepayments = query({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const loan = await ctx.db.get(args.loanId);
    if (!loan) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user || loan.userId !== user._id) return [];

    return await ctx.db
      .query("loanRepayments")
      .withIndex("by_loanId", (q) => q.eq("loanId", args.loanId))
      .order("asc")
      .take(100);
  },
});

export const getUserLoans = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("loans")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
  },
});

export const getUpcomingRepayment = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return null;

    const activeLoans = await ctx.db
      .query("loans")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let soonest: { loanNumber: string; dueDate: number; amount: number; daysUntil: number } | null = null;

    for (const loan of activeLoans) {
      if (loan.status !== "ACTIVE" && loan.status !== "DISBURSED") continue;
      if (!loan.firstRepaymentDate) continue;

      const repayments = await ctx.db
        .query("loanRepayments")
        .withIndex("by_loanId", (q) => q.eq("loanId", loan._id))
        .collect();

      const paidCount = repayments.filter((r) => r.status === "PAID").length;
      const nextDue = loan.firstRepaymentDate + paidCount * 30 * dayMs;
      const daysUntil = Math.ceil((nextDue - now) / dayMs);

      if (daysUntil >= 0 && daysUntil <= 30) {
        if (!soonest || nextDue < soonest.dueDate) {
          soonest = {
            loanNumber: loan.loanNumber,
            dueDate: nextDue,
            amount: loan.totalAmount / loan.term,
            daysUntil,
          };
        }
      }
    }

    return soonest;
  },
});

export const getLoanById = query({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const loan = await ctx.db.get(args.loanId);
    if (!loan) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || loan.userId !== user._id) return null;

    return loan;
  },
});
