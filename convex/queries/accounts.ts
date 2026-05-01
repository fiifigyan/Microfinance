import { v } from "convex/values";
import { query } from "../_generated/server";

export const getTransactionById = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user || transaction.userId !== user._id) return null;

    return transaction;
  },
});

export const getAccounts = query({
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
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(50);
  },
});

export const getRecentTransactions = query({
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
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

export const getAccountById = query({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const account = await ctx.db.get(args.accountId);
    if (!account) return null;

    // Verify the requesting user owns this account
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || account.userId !== user._id) return null;

    return account;
  },
});

export const getAccountStatement = query({
  args: {
    accountId: v.id("accounts"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const account = await ctx.db.get(args.accountId);
    if (!account) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user || account.userId !== user._id) return null;

    let txQuery = ctx.db
      .query("transactions")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .order("desc");

    const all = await txQuery.take(200);

    const filtered = all.filter((tx) => {
      if (args.startDate && tx.createdAt < args.startDate) return false;
      if (args.endDate && tx.createdAt > args.endDate) return false;
      return true;
    });

    const completed = filtered.filter((tx) => tx.status === "COMPLETED");
    const totalIn = completed
      .filter((tx) => tx.type === "DEPOSIT")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalOut = completed
      .filter((tx) => tx.type !== "DEPOSIT")
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      account,
      transactions: filtered,
      summary: {
        totalIn,
        totalOut,
        net: totalIn - totalOut,
        count: filtered.length,
      },
      generatedAt: Date.now(),
    };
  },
});

export const getAccountTransactions = query({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const account = await ctx.db.get(args.accountId);
    if (!account) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || account.userId !== user._id) return [];

    return await ctx.db
      .query("transactions")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .order("desc")
      .take(50);
  },
});
