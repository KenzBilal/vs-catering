import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const seedDropPoints = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("dropPoints").collect();
    if (existing.length > 0) return;
    const defaults = ["Main Gate", "Dakoha", "Law Gate"];
    for (const name of defaults) {
      await ctx.db.insert("dropPoints", { name, isActive: true });
    }
  },
});

export const getDropPoints = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("dropPoints")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const addDropPoint = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db.insert("dropPoints", { name, isActive: true });
  },
});

export const deactivateDropPoint = mutation({
  args: { dropPointId: v.id("dropPoints") },
  handler: async (ctx, { dropPointId }) => {
    await ctx.db.patch(dropPointId, { isActive: false });
  },
});
