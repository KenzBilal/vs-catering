import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./auth";

// Cleans up expired sessions (runs hourly via cron)
export const cleanExpiredSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sessions = await ctx.db.query("sessions").collect();
    for (const session of sessions) {
      if (session.expiresAt < now) {
        await ctx.db.delete(session._id);
      }
    }
  },
});

// Cleans up old login attempt records (older than 1 hour)
export const cleanLoginAttempts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 60 * 60 * 1000;
    const records = await ctx.db.query("loginAttempts").collect();
    for (const record of records) {
      if (record.windowStart < cutoff) {
        await ctx.db.delete(record._id);
      }
    }
  },
});

// NUCLEAR RESET: Clears ALL data from the database
// (Use for testing only, deletes everything except the calling admin)
export const nuclearReset = mutation({
  args: { token: v.string(), confirmationCode: v.string() },
  handler: async (ctx, { token, confirmationCode }) => {
    if (confirmationCode !== "RESET_NUCLEAR_DATA") {
      throw new ConvexError("Invalid confirmation code.");
    }
    const caller = await requireAdmin(ctx, token);
    
    const tables = [
      "caterings",
      "registrations",
      "payments",
      "paymentGroups",
      "notifications",
      "dropPoints",
      "adminSettings",
      "loginAttempts"
    ];

    for (const table of tables) {
      const records = await ctx.db.query(table).collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
    }

    // Delete all sessions except the current one
    const sessions = await ctx.db.query("sessions").collect();
    for (const s of sessions) {
      if (s.token !== token) {
        await ctx.db.delete(s._id);
      }
    }

    // Delete all users except the caller
    const users = await ctx.db.query("users").collect();
    for (const u of users) {
      if (u._id !== caller._id) {
        await ctx.db.delete(u._id);
      }
    }

    return { success: true, message: "Database reset complete." };
  },
});

