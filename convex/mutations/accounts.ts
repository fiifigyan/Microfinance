import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createAccount = mutation({
  args: {
    type: v.union(
      v.literal("SAVINGS"),
      v.literal("CURRENT"),
      v.literal("FIXED_DEPOSIT")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const accountNumber = `ASA${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;

    const accountId = await ctx.db.insert("accounts", {
      accountNumber,
      userId: user._id,
      type: args.type,
      balance: 0,
      currency: "GHS",
      isActive: true,
      createdAt: Date.now(),
    });

    return { accountId, accountNumber };
  },
});
