import { internalMutation } from "./_generated/server";

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
