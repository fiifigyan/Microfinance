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

// ─── Deposit ──────────────────────────────────────────────────────────────────

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");
    if (!account.isActive) throw new Error("Account is inactive");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user || account.userId !== user._id) throw new Error("Unauthorized");

    if (args.amount < 1) throw new Error("Minimum deposit is GHS 1");

    const reference = `DEP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const transactionId = await ctx.db.insert("transactions", {
      transactionId: reference,
      accountId: args.accountId,
      userId: user._id,
      type: "DEPOSIT",
      amount: args.amount,
      fee: 0,
      status: "PENDING",
      method: args.method,
      reference,
      description: `Deposit via ${args.method.replace(/_/g, " ")}`,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.actions.payments.processDeposit, {
      transactionId,
      amount: args.amount,
      method: args.method,
      phoneNumber: args.phoneNumber,
      reference,
      email: identity.email!,
    });

    return { transactionId, reference, status: "PENDING" };
  },
});

// Called by processDeposit (immediate success) and completeDepositByReference (webhook)
export const completeDeposit = internalMutation({
  args: {
    transactionId: v.id("transactions"),
    externalReference: v.string(),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction || transaction.status !== "PENDING") return;

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

    await notifyUser(
      ctx,
      transaction.userId,
      "Deposit Successful",
      `GHS ${transaction.amount.toFixed(2)} has been credited to your account.`,
    );
  },
});

// Called by the Paystack charge.success webhook
export const completeDepositByReference = internalMutation({
  args: {
    reference: v.string(),
    externalReference: v.string(),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();
    if (!transaction || transaction.status !== "PENDING") return;

    await ctx.db.patch(transaction._id, {
      status: "COMPLETED",
      externalReference: args.externalReference,
      completedAt: Date.now(),
    });

    const account = await ctx.db.get(transaction.accountId);
    if (account) {
      await ctx.db.patch(transaction.accountId, {
        balance: account.balance + transaction.amount,
      });
    }
  },
});

// ─── Withdrawal ───────────────────────────────────────────────────────────────

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");
    if (!account.isActive) throw new Error("Account is inactive");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user || account.userId !== user._id) throw new Error("Unauthorized");

    if (args.amount < 1) throw new Error("Minimum withdrawal is GHS 1");
    if (account.balance < args.amount) throw new Error("Insufficient funds");

    const reference = `WTH-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Deduct balance upfront to prevent double-spend.
    // failWithdrawal refunds it if the Paystack transfer fails.
    await ctx.db.patch(args.accountId, {
      balance: account.balance - args.amount,
    });

    const transactionId = await ctx.db.insert("transactions", {
      transactionId: reference,
      accountId: args.accountId,
      userId: user._id,
      type: "WITHDRAWAL",
      amount: args.amount,
      fee: 0,
      status: "PENDING",
      method: args.method,
      reference,
      description: `Withdrawal to +233${args.phoneNumber}`,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.actions.payments.processWithdrawal, {
      transactionId,
      amount: args.amount,
      method: args.method,
      phoneNumber: args.phoneNumber,
      reference,
    });

    return { transactionId, reference, status: "PENDING" };
  },
});

// Called by processWithdrawal (immediate success) and completeWithdrawalByReference (webhook)
export const completeWithdrawal = internalMutation({
  args: {
    transactionId: v.id("transactions"),
    externalReference: v.string(),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction || transaction.status !== "PENDING") return;

    await ctx.db.patch(args.transactionId, {
      status: "COMPLETED",
      externalReference: args.externalReference,
      completedAt: Date.now(),
    });
  },
});

// Called if Paystack rejects the transfer
export const failWithdrawal = internalMutation({
  args: {
    transactionId: v.id("transactions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction || transaction.status !== "PENDING") return;

    // Refund deducted balance
    const account = await ctx.db.get(transaction.accountId);
    if (account) {
      await ctx.db.patch(transaction.accountId, {
        balance: account.balance + transaction.amount,
      });
    }

    await ctx.db.patch(args.transactionId, {
      status: "FAILED",
      description: args.reason ? `Failed: ${args.reason}` : transaction.description,
      completedAt: Date.now(),
    });

    await notifyUser(
      ctx,
      transaction.userId,
      "Withdrawal Failed",
      `Your withdrawal of GHS ${transaction.amount.toFixed(2)} could not be processed.`,
    );
  },
});

// Called by the Paystack transfer.success webhook
export const completeWithdrawalByReference = internalMutation({
  args: {
    reference: v.string(),
    externalReference: v.string(),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();
    if (!transaction || transaction.status !== "PENDING") return;

    await ctx.db.patch(transaction._id, {
      status: "COMPLETED",
      externalReference: args.externalReference,
      completedAt: Date.now(),
    });
  },
});

// Called by the Paystack transfer.failed / transfer.reversed webhook
export const failWithdrawalByReference = internalMutation({
  args: {
    reference: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();
    if (!transaction || transaction.status !== "PENDING") return;

    const account = await ctx.db.get(transaction.accountId);
    if (account) {
      await ctx.db.patch(transaction.accountId, {
        balance: account.balance + transaction.amount,
      });
    }

    await ctx.db.patch(transaction._id, {
      status: "FAILED",
      description: args.reason ? `Failed: ${args.reason}` : transaction.description,
      completedAt: Date.now(),
    });
  },
});

// ─── Transfer (internal, between accounts) ────────────────────────────────────

export const initiateTransfer = mutation({
  args: {
    fromAccountId: v.id("accounts"),
    toAccountId: v.id("accounts"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (args.fromAccountId === args.toAccountId)
      throw new Error("Cannot transfer to the same account");

    const fromAccount = await ctx.db.get(args.fromAccountId);
    const toAccount = await ctx.db.get(args.toAccountId);
    if (!fromAccount || !toAccount) throw new Error("Account not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user || fromAccount.userId !== user._id) throw new Error("Unauthorized");

    if (args.amount < 1) throw new Error("Minimum transfer is GHS 1");
    if (fromAccount.balance < args.amount) throw new Error("Insufficient funds");

    const reference = `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const debitTxId = await ctx.db.insert("transactions", {
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

    await ctx.db.insert("transactions", {
      transactionId: `${reference}-CR`,
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

    await ctx.db.patch(args.fromAccountId, {
      balance: fromAccount.balance - args.amount,
    });
    await ctx.db.patch(args.toAccountId, {
      balance: toAccount.balance + args.amount,
    });

    return { transactionId: debitTxId, reference, status: "COMPLETED" };
  },
});
