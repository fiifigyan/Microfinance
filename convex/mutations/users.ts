import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const savePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return;

    await ctx.db.patch(user._id, { pushToken: args.token });
  },
});

export const updateProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new Error("User not found");

    const patch: Record<string, string> = {};
    if (args.firstName !== undefined) patch.firstName = args.firstName.trim();
    if (args.lastName !== undefined) patch.lastName = args.lastName.trim();
    if (args.phone !== undefined) patch.phone = args.phone.trim();

    await ctx.db.patch(user._id, patch);
    return user._id;
  },
});

export const createUser = mutation({
  args: {
    phone: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Returning user — already has a linked Clerk ID
    const existingByClerkId = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (existingByClerkId) return existingByClerkId._id;

    // Invited staff — pre-created by an admin, no Clerk ID yet
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (existingByEmail) {
      await ctx.db.patch(existingByEmail._id, {
        clerkId: identity.subject,
        isVerified: true,
      });
      return existingByEmail._id;
    }

    // Brand new customer
    const nameParts = identity.name?.split(" ") ?? [];
    const firstName = args.firstName ?? nameParts[0] ?? "";
    const lastName = args.lastName ?? nameParts.slice(1).join(" ") ?? "";

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email!,
      phone: args.phone,
      firstName,
      lastName,
      isVerified: true,
      role: "CUSTOMER",
      createdAt: Date.now(),
    });

    // Auto-create a default savings account for new customers only
    const accountNumber = `ASA${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;
    await ctx.db.insert("accounts", {
      accountNumber,
      userId,
      type: "SAVINGS",
      balance: 0,
      currency: "GHS",
      isActive: true,
      createdAt: Date.now(),
    });

    return userId;
  },
});
