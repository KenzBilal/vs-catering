import { v, ConvexError } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

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

    // Merge and filter for admins (they don't need to see "New Event" global alerts)
    let merged = [...individual, ...global];
    if (user.role === "admin" || user.role === "sub_admin") {
      merged = merged.filter(n => 
        n.category !== "global" || 
        (n.title !== "New Event" && n.title !== "Event Update" && n.title !== "Event Cancelled")
      );
    }

    return merged
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);

  },
});

export const getUnreadCount = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getUserFromToken(ctx, token);
    if (!user) return 0;

    const lastRead = user.lastReadNotificationsAt || 0;

    // Count unread individual notifications
    const unreadIndividual = await ctx.db
      .query("notifications")
      .withIndex("by_targetUser", (q) => q.eq("targetUserId", user._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    // Count unread global notifications (created after lastRead)
    let unreadGlobal = await ctx.db
      .query("notifications")
      .withIndex("by_category", (q) => q.eq("category", "global"))
      .filter((q) => q.gt(q.field("createdAt"), lastRead))
      .collect();

    // Filter out redundant global notifications for admins so count matches inbox
    if (user.role === "admin" || user.role === "sub_admin") {
      unreadGlobal = unreadGlobal.filter(n => 
        n.title !== "New Event" && n.title !== "Event Update" && n.title !== "Event Cancelled"
      );
    }

    return unreadIndividual.length + unreadGlobal.length;

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

    // Mark individual as read
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_targetUser", (q) => q.eq("targetUserId", user._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }

    // Update user's last read timestamp for global notifications
    await ctx.db.patch(user._id, { lastReadNotificationsAt: Date.now() });
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




