import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./auth";

export const createUser = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    stayType: v.union(v.literal("hostel"), v.literal("day_scholar")),
    gender: v.union(v.literal("male"), v.literal("female")),
    defaultDropPoint: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
    if (existing) throw new Error("Phone number already registered.");

    return await ctx.db.insert("users", {
      ...args,
      role: "student",
      createdAt: Date.now(),
    });
  },
});

export const loginUser = mutation({
  args: { phone: v.string(), name: v.string() },
  handler: async (ctx, { phone, name }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
    if (!user) return null;
    if (user.name.toLowerCase() !== name.toLowerCase()) return null;
    
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
    
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt,
    });
    
    return { ...user, token };
  },
});

export const logoutUser = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

export const updatePreferences = mutation({
  args: {
    userId: v.id("users"),
    defaultDropPoint: v.string(),
    stayType: v.union(v.literal("hostel"), v.literal("day_scholar")),
  },
  handler: async (ctx, { userId, defaultDropPoint, stayType }) => {
    await ctx.db.patch(userId, { defaultDropPoint, stayType });
  },
});

export const setUserRole = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("sub_admin"), v.literal("student")),
  },
  handler: async (ctx, { token, userId, role }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(userId, { role });
  },
});

export const getAllStudents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
