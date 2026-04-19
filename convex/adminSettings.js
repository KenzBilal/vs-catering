import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, getUserFromToken } from "./auth";
import { sanitizeString } from "./utils";

const DEFAULT_PERMISSIONS = [
  { 
    permission: "manage_caterings", 
    enabled: false,
    label: "Manage Events",
    description: "Create and edit catering events",
    category: "events"
  },
  { 
    permission: "mark_attendance", 
    enabled: false,
    label: "Mark Attendance",
    description: "Check student attendance",
    category: "attendance"
  },
  { 
    permission: "manage_payments", 
    enabled: false,
    label: "Handle Payments",
    description: "Manage student payments",
    category: "payments"
  },
  { 
    permission: "manage_users", 
    enabled: false,
    label: "View Students",
    description: "Access student information",
    category: "users"
  },
];

// ─── QUERIES ────────────────────────────────────────────────────────────────

export const getSettings = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const settings = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    return settings;
  },
});


export const getSubAdminPermissions = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    // Both admins and sub-admins can view permissions
    const user = await getUserFromToken(ctx, token);
    if (!user || (user.role !== "admin" && user.role !== "sub_admin")) {
      throw new ConvexError("Unauthorized.");
    }

    const settings = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    return settings?.subAdminPermissions || DEFAULT_PERMISSIONS;
  },
});

export const getDropPoints = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("dropPoints").collect();
  },
});

export const getMyPermissions = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getUserFromToken(ctx, token);
    if (!user) return DEFAULT_PERMISSIONS.map(p => ({ ...p, enabled: false }));

    if (user.role === "admin") {
      return DEFAULT_PERMISSIONS.map(p => ({ ...p, enabled: true }));
    }

    if (user.role === "sub_admin") {
      const settings = await ctx.db
        .query("adminSettings")
        .withIndex("by_key", (q) => q.eq("key", "global"))
        .first();
      return settings?.subAdminPermissions || DEFAULT_PERMISSIONS;
    }

    return DEFAULT_PERMISSIONS.map(p => ({ ...p, enabled: false }));
  },
});

export const getPermissionConfig = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getUserFromToken(ctx, token);
    if (!user || (user.role !== "admin" && user.role !== "sub_admin")) {
      throw new ConvexError("Unauthorized.");
    }

    const settings = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    
    return settings?.subAdminPermissions || DEFAULT_PERMISSIONS;
  },
});

export const getSubAdmins = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    return await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("role"), "sub_admin"))
      .collect();
  },
});

// ─── MUTATIONS ──────────────────────────────────────────────────────────────

export const initializeSettings = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const existing = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    
    if (existing) return existing._id;

    return await ctx.db.insert("adminSettings", {
      key: "global",
      subAdminPermissions: DEFAULT_PERMISSIONS,
      createdAt: Date.now(),
    });
  },
});

export const togglePermission = mutation({
  args: { 
    token: v.string(), 
    permission: v.string(), 
    enabled: v.boolean() 
  },
  handler: async (ctx, { token, permission, enabled }) => {
    await requireAdmin(ctx, token);
    const settings = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    
    if (!settings) throw new ConvexError("Settings not initialized.");

    const newPerms = settings.subAdminPermissions.map(p => 
      p.permission === permission ? { ...p, enabled } : p
    );

    await ctx.db.patch(settings._id, { subAdminPermissions: newPerms });
  },
});

export const addDropPoint = mutation({
  args: { token: v.string(), name: v.string() },
  handler: async (ctx, { token, name }) => {
    await requireAdmin(ctx, token);
    const cleanName = sanitizeString(name).trim();
    if (!cleanName) throw new ConvexError("Name is required.");

    const existing = await ctx.db
      .query("dropPoints")
      .filter(q => q.eq(q.field("name"), cleanName))
      .first();
    if (existing) throw new ConvexError("Drop point already exists.");

    await ctx.db.insert("dropPoints", { name: cleanName, isActive: true });
  },
});

export const removeDropPoint = mutation({
  args: { token: v.string(), dropPointId: v.id("dropPoints") },
  handler: async (ctx, { token, dropPointId }) => {
    await requireAdmin(ctx, token);
    await ctx.db.delete(dropPointId);
  },
});

export const toggleDropPointStatus = mutation({
  args: { token: v.string(), dropPointId: v.id("dropPoints"), isActive: v.boolean() },
  handler: async (ctx, { token, dropPointId, isActive }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(dropPointId, { isActive });
  },
});
