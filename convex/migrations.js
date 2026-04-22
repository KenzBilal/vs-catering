import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./auth";

export const cleanupAdminSettings = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
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
