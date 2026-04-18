import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, getUserFromToken } from "./auth";

export const seedDropPoints = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const existing = await ctx.db.query("dropPoints").collect();
    if (existing.length > 0) return;
    const defaults = ["Main Gate", "Dakoha", "Law Gate"];
    for (const name of defaults) {
      await ctx.db.insert("dropPoints", { name, isActive: true });
    }
  },
});

export const getDropPoints = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getUserFromToken(ctx, token);
    if (!user) throw new ConvexError("Not authenticated.");

    return await ctx.db
      .query("dropPoints")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const addDropPoint = mutation({
  args: { name: v.string(), token: v.string() },
  handler: async (ctx, { name, token }) => {
    await requireAdmin(ctx, token);
    return await ctx.db.insert("dropPoints", { name, isActive: true });
  },
});

export const deactivateDropPoint = mutation({
  args: { dropPointId: v.id("dropPoints"), token: v.string() },
  handler: async (ctx, { dropPointId, token }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(dropPointId, { isActive: false });
  },
});
