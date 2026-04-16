import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";

export const initiateDeposit = mutation({
  args: {
    accountId: v.id("accounts"),
    amount: v.number(),
    method: v.union(
      v.literal("MTN_MOMO"),
      v.literal("VODAFONE_CASH"),
      v.literal("AIRTELTIGO_MONEY"),
    ),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");

    if (args.amount < 1) {
      throw new Error("Minimum deposit is GHS 1");
    }

    const reference = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const transactionId = await ctx.db.insert("transactions", {
      transactionId: reference,
      accountId: args.accountId,
      userId: account.userId,
      type: "DEPOSIT",
      amount: args.amount,
      fee: 0,
      status: "PENDING",
      method: args.method,
      reference,
      description: `Deposit via ${args.method}`,
      createdAt: Date.now(),
    });

    // @ts-ignore - TypeScript needs time to generate proper types
    await ctx.scheduler.runAfter(0, internal.actions.payments.processDeposit, {
      transactionId,
      amount: args.amount,
      method: args.method,
      phoneNumber: args.phoneNumber,
      reference,
    });

    return { transactionId, reference, status: "PENDING" };
  },
});

export const completeDeposit = mutation({
  args: {
    transactionId: v.id("transactions"),
    externalReference: v.string(),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("Transaction not found");
    if (transaction.status !== "PENDING") {
      throw new Error("Transaction is not pending");
    }

    await ctx.db.patch(args.transactionId, {
      status: "COMPLETED",
      externalReference: args.externalReference,
      completedAt: Date.now(),
    });

    const account = await ctx.db.get(transaction.accountId);
    if (!account) throw new Error("Account not found");

    await ctx.db.patch(transaction.accountId, {
      balance: account.balance + transaction.amount,
    });

    return { success: true };
  },
});

export const initiateWithdrawal = mutation({
  args: {
    accountId: v.id("accounts"),
    amount: v.number(),
    method: v.union(
      v.literal("MTN_MOMO"),
      v.literal("VODAFONE_CASH"),
      v.literal("AIRTELTIGO_MONEY"),
    ),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");

    if (account.balance < args.amount) {
      throw new Error("Insufficient funds");
    }

    const reference = `WTH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const transactionId = await ctx.db.insert("transactions", {
      transactionId: reference,
      accountId: args.accountId,
      userId: account.userId,
      type: "WITHDRAWAL",
      amount: args.amount,
      fee: 0,
      status: "PENDING",
      method: args.method,
      reference,
      description: `Withdrawal to ${args.phoneNumber}`,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.accountId, {
      balance: account.balance - args.amount,
    });

    await ctx.db.patch(transactionId, {
      status: "COMPLETED",
      completedAt: Date.now(),
    });

    return { transactionId, reference, status: "COMPLETED" };
  },
});

export const initiateWithdraw = mutation({
  args: {
    accountId: v.id("accounts"),
    amount: v.number(),
    method: v.union(
      v.literal("MTN_MOMO"),
      v.literal("VODAFONE_CASH"),
      v.literal("AIRTELTIGO_MONEY"),
    ),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");

    if (account.balance < args.amount) {
      throw new Error("Insufficient funds");
    }

    const reference = `WTH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const transactionId = await ctx.db.insert("transactions", {
      transactionId: reference,
      accountId: args.accountId,
      userId: account.userId,
      type: "WITHDRAWAL",
      amount: args.amount,
      fee: 0,
      status: "PENDING",
      method: args.method,
      reference,
      description: `Withdrawal to ${args.phoneNumber}`,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.accountId, {
      balance: account.balance - args.amount,
    });

    await ctx.db.patch(transactionId, {
      status: "COMPLETED",
      completedAt: Date.now(),
    });

    return { transactionId, reference, status: "COMPLETED" };
  },
});

export const initiateTransfer = mutation({
  args: {
    fromAccountId: v.id("accounts"),
    toAccountId: v.id("accounts"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.fromAccountId === args.toAccountId) {
      throw new Error("Cannot transfer to the same account");
    }

    const fromAccount = await ctx.db.get(args.fromAccountId);
    const toAccount = await ctx.db.get(args.toAccountId);

    if (!fromAccount || !toAccount) {
      throw new Error("Account not found");
    }

    if (fromAccount.balance < args.amount) {
      throw new Error("Insufficient funds");
    }

    if (args.amount < 1) {
      throw new Error("Minimum transfer is GHS 1");
    }

    const reference = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create debit transaction
    const debitTransactionId = await ctx.db.insert("transactions", {
      transactionId: reference,
      accountId: args.fromAccountId,
      userId: fromAccount.userId,
      type: "TRANSFER",
      amount: args.amount,
      fee: 0,
      status: "COMPLETED",
      method: "BANK_TRANSFER",
      reference,
      description: `Transfer to ${toAccount.accountNumber}`,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    // Create credit transaction
    await ctx.db.insert("transactions", {
      transactionId: reference,
      accountId: args.toAccountId,
      userId: toAccount.userId,
      type: "TRANSFER",
      amount: args.amount,
      fee: 0,
      status: "COMPLETED",
      method: "BANK_TRANSFER",
      reference,
      description: `Transfer from ${fromAccount.accountNumber}`,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    // Update balances
    await ctx.db.patch(args.fromAccountId, {
      balance: fromAccount.balance - args.amount,
    });

    await ctx.db.patch(args.toAccountId, {
      balance: toAccount.balance + args.amount,
    });

    return {
      transactionId: debitTransactionId,
      reference,
      status: "COMPLETED",
    };
  },
});
