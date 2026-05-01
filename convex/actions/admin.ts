"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

export const inviteStaff = action({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal("AGENT"), v.literal("ADMIN")),
    redirectUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.runQuery(internal.queries.admin.getCallerForAuth, {});
    if (!caller) throw new Error("Not authenticated");
    if (caller.role !== "ADMIN") throw new Error("Unauthorized — must be ADMIN");

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) throw new Error("CLERK_SECRET_KEY is not configured");

    const body: Record<string, unknown> = {
      email_address: args.email,
      public_metadata: { role: args.role },
    };
    if (args.redirectUrl) body.redirect_url = args.redirectUrl;

    const response = await fetch("https://api.clerk.com/v1/invitations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json() as { errors?: { message: string }[] };
      throw new Error(error.errors?.[0]?.message ?? "Failed to send Clerk invitation");
    }

    await ctx.runMutation(internal.mutations.admin.preCreateStaffUser, {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
    });

    return { success: true, email: args.email, role: args.role };
  },
});
