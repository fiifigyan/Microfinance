import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createAccount = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("SAVINGS"),
      v.literal("CURRENT"),
      v.literal("FIXED_DEPOSIT")
    ),
  },
  handler: async (ctx, args) => {
    const accountNumber = `ASA${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;

    const accountId = await ctx.db.insert("accounts", {
      accountNumber,
      userId: args.userId,
      type: args.type,
      balance: 0,
      currency: "GHS",
      isActive: true,
      createdAt: Date.now(),
    });

    return { accountId, accountNumber };
  },
});