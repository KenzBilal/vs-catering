import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function computeStatus(dates) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const eventDate = new Date(dates[0]);
  eventDate.setHours(0, 0, 0, 0);
  const lastDate = new Date(dates[dates.length - 1]);
  lastDate.setHours(0, 0, 0, 0);

  if (lastDate < today) return "ended";
  if (eventDate.getTime() === today.getTime()) return "today";
  if (eventDate.getTime() === tomorrow.getTime()) return "tomorrow";
  return "upcoming";
}

export const createCatering = mutation({
  args: {
    title: v.string(),
    place: v.string(),
    timeOfDay: v.union(v.literal("evening"), v.literal("night")),
    specificTime: v.string(),
    dates: v.array(v.string()),
    isTwoDay: v.boolean(),
    sameSlotsForBothDays: v.boolean(),
    joinRule: v.union(v.literal("any_day"), v.literal("both_days")),
    photoRequired: v.boolean(),
    dressCodeNotes: v.string(),
    slots: v.array(v.object({
      day: v.number(),
      role: v.string(),
      limit: v.number(),
      pay: v.number(),
    })),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const status = computeStatus(args.dates);
    return await ctx.db.insert("caterings", {
      ...args,
      status,
      createdAt: Date.now(),
    });
  },
});

export const updateCatering = mutation({
  args: {
    cateringId: v.id("caterings"),
    title: v.optional(v.string()),
    place: v.optional(v.string()),
    timeOfDay: v.optional(v.union(v.literal("evening"), v.literal("night"))),
    specificTime: v.optional(v.string()),
    photoRequired: v.optional(v.boolean()),
    dressCodeNotes: v.optional(v.string()),
    slots: v.optional(v.array(v.object({
      day: v.number(),
      role: v.string(),
      limit: v.number(),
      pay: v.number(),
    }))),
  },
  handler: async (ctx, { cateringId, ...updates }) => {
    await ctx.db.patch(cateringId, updates);
  },
});

export const listCaterings = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("caterings").order("desc").collect();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return all.filter((c) => {
      const lastDate = new Date(c.dates[c.dates.length - 1]);
      lastDate.setHours(0, 0, 0, 0);
      return lastDate >= thirtyDaysAgo;
    });
  },
});

export const getCatering = query({
  args: { cateringId: v.id("caterings") },
  handler: async (ctx, { cateringId }) => {
    return await ctx.db.get(cateringId);
  },
});

export const refreshStatuses = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("caterings").collect();
    for (const c of all) {
      const status = computeStatus(c.dates);
      if (status !== c.status) {
        await ctx.db.patch(c._id, { status });
      }
    }
  },
});
