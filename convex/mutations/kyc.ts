import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

async function notifyUser(ctx: MutationCtx, userId: Id<"users">, title: string, body: string) {
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

export const submitKyc = mutation({
  args: {
    documentType: v.union(
      v.literal("NATIONAL_ID"),
      v.literal("PASSPORT"),
      v.literal("DRIVERS_LICENSE"),
      v.literal("VOTERS_CARD"),
    ),
    documentNumber: v.string(),
    fullName: v.string(),
    dateOfBirth: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new Error("User not found");

    if (!args.documentNumber.trim()) throw new Error("Document number is required");
    if (!args.fullName.trim()) throw new Error("Full name is required");
    if (!args.dateOfBirth.trim()) throw new Error("Date of birth is required");

    // Check for existing pending/approved KYC
    const existing = await ctx.db
      .query("kycDocuments")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (existing?.status === "APPROVED") throw new Error("KYC already verified");
    if (existing?.status === "PENDING") throw new Error("KYC review already in progress");

    if (existing) {
      // Re-submission after rejection
      await ctx.db.patch(existing._id, {
        documentType: args.documentType,
        documentNumber: args.documentNumber,
        fullName: args.fullName,
        dateOfBirth: args.dateOfBirth,
        status: "PENDING",
        reviewedBy: undefined,
        reviewNote: undefined,
        submittedAt: Date.now(),
        reviewedAt: undefined,
      });
      return existing._id;
    }

    return await ctx.db.insert("kycDocuments", {
      userId: user._id,
      documentType: args.documentType,
      documentNumber: args.documentNumber,
      fullName: args.fullName,
      dateOfBirth: args.dateOfBirth,
      status: "PENDING",
      submittedAt: Date.now(),
    });
  },
});

export const reviewKyc = mutation({
  args: {
    kycId: v.id("kycDocuments"),
    decision: v.union(v.literal("APPROVED"), v.literal("REJECTED")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const reviewer = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!reviewer || (reviewer.role !== "ADMIN" && reviewer.role !== "AGENT"))
      throw new Error("Unauthorized");

    const kyc = await ctx.db.get(args.kycId);
    if (!kyc) throw new Error("KYC record not found");
    if (kyc.status !== "PENDING") throw new Error("KYC is not pending review");

    await ctx.db.patch(args.kycId, {
      status: args.decision,
      reviewedBy: reviewer._id,
      reviewNote: args.note,
      reviewedAt: Date.now(),
    });

    if (args.decision === "APPROVED") {
      await ctx.db.patch(kyc.userId, { isVerified: true });
      await notifyUser(
        ctx,
        kyc.userId,
        "Identity Verified",
        "Your identity has been verified. You can now apply for loans.",
      );
    } else {
      await notifyUser(
        ctx,
        kyc.userId,
        "KYC Review Update",
        args.note
          ? `Your KYC submission was rejected: ${args.note}`
          : "Your KYC submission was rejected. Please re-submit with correct details.",
      );
    }
  },
});
