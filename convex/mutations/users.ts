import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    phone: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      phone: args.phone,
      firstName: args.firstName,
      lastName: args.lastName,
      isVerified: false,
      role: "CUSTOMER",
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const verifyUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isVerified: true,
    });
    return true;
  },
});
