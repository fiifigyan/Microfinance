"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export const processDeposit = action({
  args: {
    transactionId: v.id("transactions"),
    amount: v.number(),
    method: v.string(),
    phoneNumber: v.string(),
    reference: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; externalReference: string }> => {
    console.log(`💰 Processing ${args.method} deposit of GHS ${args.amount}`);
    console.log(`📱 Phone: ${args.phoneNumber}`);
    console.log(`🔖 Reference: ${args.reference}`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const externalReference = `MOMO-${Date.now()}`;

    // @ts-ignore - TypeScript needs time to generate proper types
    await ctx.runMutation(internal.mutations.transactions.completeDeposit, {
      transactionId: args.transactionId,
      externalReference,
    });

    console.log(`✅ Deposit completed: ${externalReference}`);
    return { success: true, externalReference };
  },
});