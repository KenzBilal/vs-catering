import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserFromToken, requireAdmin } from "./auth";

// ─── QUERIES ────────────────────────────────────────────────────────────────

export const getMyNotifications = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getUserFromToken(ctx, token);
    if (!user) return [];

    // Fetch individual notifications
    const individual = await ctx.db
      .query("notifications")
      .withIndex("by_targetUser", (q) => q.eq("targetUserId", user._id))
      .order("desc")
      .take(50);

    // Fetch global notifications
    const global = await ctx.db
      .query("notifications")
      .withIndex("by_category", (q) => q.eq("category", "global"))
      .order("desc")
      .take(50);

    // Merge and sort
    return [...individual, ...global]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);
  },
});

export const getUnreadCount = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getUserFromToken(ctx, token);
    if (!user) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_targetUser", (q) => q.eq("targetUserId", user._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    return unread.length;
  },
});

export const getPayoutSettings = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getUserFromToken(ctx, token);
    if (!user) throw new ConvexError("Unauthorized.");

    const settings = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    return settings?.payoutSettings || null;
  },
});

// ─── MUTATIONS ──────────────────────────────────────────────────────────────

export const markAsRead = mutation({
  args: { token: v.string(), notificationId: v.id("notifications") },
  handler: async (ctx, { token, notificationId }) => {
    const user = await getUserFromToken(ctx, token);
    const notification = await ctx.db.get(notificationId);
    
    if (!notification || (notification.category === "individual" && notification.targetUserId !== user?._id)) {
      return;
    }

    await ctx.db.patch(notificationId, { isRead: true });
  },
});

export const markAllAsRead = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getUserFromToken(ctx, token);
    if (!user) return;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_targetUser", (q) => q.eq("targetUserId", user._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});

export const setPayoutSettings = mutation({
  args: { 
    token: v.string(), 
    payoutDate: v.optional(v.string()), 
    note: v.optional(v.string()) 
  },
  handler: async (ctx, { token, payoutDate, note }) => {
    const user = await requireAdmin(ctx, token);
    const settings = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    if (!settings) throw new ConvexError("Settings not initialized.");

    await ctx.db.patch(settings._id, {
      payoutSettings: {
        nextPayoutDate: payoutDate,
        payoutNote: note,
        lastUpdatedBy: user._id,
      },
    });
  },
});
