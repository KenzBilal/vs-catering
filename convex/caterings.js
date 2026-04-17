import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireAdmin, requireSubAdmin } from "./auth";

function sanitize(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim().slice(0, maxLen);
}

function computeStatus(dates) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const eventDate = new Date(dates[0]);
  eventDate.setHours(0, 0, 0, 0);
  const lastDate = new Date(dates[dates.length - 1]);
  lastDate.setHours(0, 0, 0, 0);

  if (lastDate < today) return "ended";
  if (eventDate.getTime() === today.getTime()) return "today";
  if (eventDate.getTime() === tomorrow.getTime()) return "tomorrow";
  return "upcoming";
}

function validateSlots(slots) {
  for (const s of slots) {
    if (!Number.isInteger(s.limit) || s.limit < 0) throw new Error("Slot limit cannot be negative.");
    if (typeof s.pay !== "number" || s.pay < 0) throw new Error("Pay cannot be negative.");
    if (!["service_boy", "service_girl", "captain_male"].includes(s.role)) {
      throw new Error(`Unknown role: ${s.role}`);
    }
  }
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
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const place = sanitize(args.place, 200);
    const dressCodeNotes = sanitize(args.dressCodeNotes, 2000);
    if (!place) throw new Error("Place is required.");
    if (args.dates.length === 0) throw new Error("At least one date is required.");
    validateSlots(args.slots);

    const { token, place: _p, dressCodeNotes: _d, ...rest } = args;
    const status = computeStatus(args.dates);

    return await ctx.db.insert("caterings", {
      ...rest,
      place,
      dressCodeNotes,
      title: place,
      status,
      createdAt: Date.now(),
    });
  },
});

export const updateCatering = mutation({
  args: {
    cateringId: v.id("caterings"),
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
    token: v.string(),
  },
  handler: async (ctx, { cateringId, token, ...updates }) => {
    await requireAdmin(ctx, token);

    const existing = await ctx.db.get(cateringId);
    if (!existing) throw new Error("Event not found.");
    if (existing.status === "cancelled") throw new Error("Cannot edit a cancelled event.");

    const sanitized = {};
    if (updates.place !== undefined) {
      sanitized.place = sanitize(updates.place, 200);
      sanitized.title = sanitized.place;
      if (!sanitized.place) throw new Error("Place cannot be empty.");
    }
    if (updates.dressCodeNotes !== undefined) {
      sanitized.dressCodeNotes = sanitize(updates.dressCodeNotes, 2000);
    }
    if (updates.slots !== undefined) {
      validateSlots(updates.slots);
      sanitized.slots = updates.slots;
    }
    if (updates.timeOfDay !== undefined) sanitized.timeOfDay = updates.timeOfDay;
    if (updates.specificTime !== undefined) sanitized.specificTime = updates.specificTime;
    if (updates.photoRequired !== undefined) sanitized.photoRequired = updates.photoRequired;

    await ctx.db.patch(cateringId, sanitized);
  },
});

export const cancelCatering = mutation({
  args: {
    cateringId: v.id("caterings"),
    token: v.string(),
  },
  handler: async (ctx, { cateringId, token }) => {
    await requireAdmin(ctx, token);
    const existing = await ctx.db.get(cateringId);
    if (!existing) throw new Error("Event not found.");
    if (existing.status === "cancelled") throw new Error("Event is already cancelled.");
    if (existing.status === "ended") throw new Error("Cannot cancel an event that has already ended.");
    await ctx.db.patch(cateringId, { status: "cancelled" });
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
      if (c.status === "cancelled") return true; // always show cancelled
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

export const refreshStatuses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("caterings").collect();
    for (const c of all) {
      if (c.status === "cancelled") continue; // never auto-update cancelled
      const status = computeStatus(c.dates);
      if (status !== c.status) {
        await ctx.db.patch(c._id, { status });
      }
    }
  },
});
