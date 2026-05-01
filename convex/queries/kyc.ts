import { v } from "convex/values";
import { query } from "../_generated/server";

export const getMyKyc = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return null;

    return ctx.db
      .query("kycDocuments")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
  },
});

export const getPendingKyc = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user || (user.role !== "ADMIN" && user.role !== "AGENT")) return [];

    const pending = await ctx.db
      .query("kycDocuments")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .order("asc")
      .take(50);

    return Promise.all(
      pending.map(async (kyc) => {
        const kycUser = await ctx.db.get(kyc.userId);
        return {
          ...kyc,
          userName: kycUser ? `${kycUser.firstName} ${kycUser.lastName}` : "Unknown",
          userEmail: kycUser?.email ?? "",
        };
      }),
    );
  },
});

export const getAllKyc = query({
  args: {
    status: v.optional(v.union(
      v.literal("PENDING"),
      v.literal("APPROVED"),
      v.literal("REJECTED"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user || (user.role !== "ADMIN" && user.role !== "AGENT")) return [];

    const docs = args.status
      ? await ctx.db
          .query("kycDocuments")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(100)
      : await ctx.db.query("kycDocuments").order("desc").take(100);

    return Promise.all(
      docs.map(async (kyc) => {
        const kycUser = await ctx.db.get(kyc.userId);
        return {
          ...kyc,
          userName: kycUser ? `${kycUser.firstName} ${kycUser.lastName}` : "Unknown",
          userEmail: kycUser?.email ?? "",
        };
      }),
    );
  },
});
