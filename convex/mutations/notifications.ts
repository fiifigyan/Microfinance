import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user || notification.userId !== user._id) return;

    await ctx.db.patch(args.notificationId, { read: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false),
      )
      .take(100);

    await Promise.all(unread.map((n) => ctx.db.patch(n._id, { read: true })));
  },
});
