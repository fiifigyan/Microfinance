"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

const MOMO_PROVIDER: Record<string, string> = {
  MTN_MOMO: "mtn",
  VODAFONE_CASH: "vod",
  AIRTELTIGO_MONEY: "atl",
};

// Bank codes used by Paystack for Ghana mobile-money transfers.
// Verify current codes via GET /bank?country=ghana&currency=GHS&type=mobile_money
const TRANSFER_BANK_CODE: Record<string, string> = {
  MTN_MOMO: "MTN",
  VODAFONE_CASH: "VOD",
  AIRTELTIGO_MONEY: "ATL",
};

async function paystack(
  path: string,
  body: object,
  secretKey: string,
): Promise<any> {
  const res = await fetch(`https://api.paystack.co${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.status) {
    throw new Error(json.message ?? `Paystack ${path} failed`);
  }
  return json.data;
}

// ─── Deposit (mobile-money collection) ────────────────────────────────────────

export const processDeposit = internalAction({
  args: {
    transactionId: v.id("transactions"),
    amount: v.number(),
    method: v.string(),
    phoneNumber: v.string(),
    reference: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY not configured");

    const provider = MOMO_PROVIDER[args.method];
    if (!provider) throw new Error(`Unsupported method: ${args.method}`);

    const data = await paystack(
      "/charge",
      {
        email: args.email,
        amount: Math.round(args.amount * 100), // GHS → pesewas
        currency: "GHS",
        mobile_money: { phone: args.phoneNumber, provider },
        reference: args.reference,
      },
      secretKey,
    );

    // Test-mode or rare immediate success — complete right away.
    // In production the charge stays PENDING until the charge.success webhook fires.
    if (data.status === "success") {
      await ctx.runMutation(internal.mutations.transactions.completeDeposit, {
        transactionId: args.transactionId,
        externalReference: data.reference ?? args.reference,
      });
    }

    return { success: true, chargeStatus: data.status };
  },
});

// ─── Loan Repayment (mobile-money collection) ─────────────────────────────────

export const processRepayment = internalAction({
  args: {
    repaymentId: v.id("loanRepayments"),
    amount: v.number(),
    method: v.string(),
    phoneNumber: v.string(),
    reference: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY not configured");

    const provider = MOMO_PROVIDER[args.method];
    if (!provider) throw new Error(`Unsupported method: ${args.method}`);

    const data = await paystack(
      "/charge",
      {
        email: args.email,
        amount: Math.round(args.amount * 100),
        currency: "GHS",
        mobile_money: { phone: args.phoneNumber, provider },
        reference: args.reference,
      },
      secretKey,
    );

    if (data.status === "success") {
      await ctx.runMutation(internal.mutations.loans.completeRepayment, {
        repaymentId: args.repaymentId,
        externalReference: data.reference ?? args.reference,
      });
    }

    return { success: true, chargeStatus: data.status };
  },
});

// ─── Withdrawal (mobile-money transfer) ───────────────────────────────────────

export const processWithdrawal = internalAction({
  args: {
    transactionId: v.id("transactions"),
    amount: v.number(),
    method: v.string(),
    phoneNumber: v.string(),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY not configured");

    const bankCode = TRANSFER_BANK_CODE[args.method];
    if (!bankCode) throw new Error(`Unsupported method: ${args.method}`);

    try {
      // Step 1 — create a transfer recipient for the mobile-money wallet
      const recipient = await paystack(
        "/transferrecipient",
        {
          type: "mobile_money",
          name: args.phoneNumber,
          account_number: args.phoneNumber,
          bank_code: bankCode,
          currency: "GHS",
        },
        secretKey,
      );

      // Step 2 — send the transfer
      const transfer = await paystack(
        "/transfer",
        {
          source: "balance",
          amount: Math.round(args.amount * 100),
          recipient: recipient.recipient_code,
          reference: args.reference,
          reason: "Withdrawal",
          currency: "GHS",
        },
        secretKey,
      );

      // Immediate success (test mode) — complete now.
      // In production completion is driven by the transfer.success webhook.
      if (transfer.status === "success" || transfer.status === "otp") {
        await ctx.runMutation(internal.mutations.transactions.completeWithdrawal, {
          transactionId: args.transactionId,
          externalReference: transfer.transfer_code ?? args.reference,
        });
      }
    } catch (err: any) {
      // Paystack rejected the transfer — refund the user's balance
      await ctx.runMutation(internal.mutations.transactions.failWithdrawal, {
        transactionId: args.transactionId,
        reason: err.message,
      });
      throw err;
    }

    return { success: true };
  },
});