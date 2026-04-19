import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const cleanupAdminSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    if (settings) {
      const { payoutSettings, ...rest } = settings;
      await ctx.db.replace(settings._id, rest);
    }
    return "ok";
  },
});
