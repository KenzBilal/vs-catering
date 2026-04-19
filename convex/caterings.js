import { v, ConvexError } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireAdmin, requireSubAdmin, getUserFromToken, checkPermission } from "./auth";

import { sanitizeString } from "./utils";

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

const MAX_PAY_PER_SLOT = 10000;

function validateSlots(slots) {
  for (const s of slots) {
    if (!Number.isInteger(s.limit) || s.limit < 0) throw new ConvexError("Slot limit cannot be negative.");
    if (s.limit > 500) throw new ConvexError("Slot limit is too high.");
    if (typeof s.pay !== "number" || s.pay < 0) throw new ConvexError("Pay cannot be negative.");
    if (s.pay > MAX_PAY_PER_SLOT) throw new ConvexError(`Pay exceeds maximum limit (₹${MAX_PAY_PER_SLOT}).`);
    if (!["service_boy", "service_girl", "captain_male", "captain_female"].includes(s.role)) {
      throw new ConvexError(`Unknown role: ${s.role}`);
    }
  }
}

function validateDates(dates, isTwoDay) {
  if (dates.length === 0) throw new ConvexError("At least one date is required.");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const d1 = new Date(dates[0]);
  if (isNaN(d1.getTime())) throw new ConvexError("Invalid date format.");
  if (d1 < today) throw new ConvexError("Cannot create an event for a past date.");
  
  const maxFuture = new Date();
  maxFuture.setFullYear(maxFuture.getFullYear() + 1);
  if (d1 > maxFuture) throw new ConvexError("Cannot schedule events more than 1 year in advance.");

  if (isTwoDay) {
    if (dates.length < 2) throw new ConvexError("Second date is required for two-day events.");
    const d2 = new Date(dates[1]);
    if (isNaN(d2.getTime())) throw new ConvexError("Invalid second date format.");
    if (d2 <= d1) throw new ConvexError("Second date must be after the first date.");
  }
}

export const createCatering = mutation({
  args: {
    title: v.string(),
    place: v.string(),
    timeOfDay: v.union(v.literal("day"), v.literal("night")),
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
    await checkPermission(ctx, args.token, "manage_caterings");

    const place = sanitizeString(args.place).slice(0, 200);
    const dressCodeNotes = sanitizeString(args.dressCodeNotes).slice(0, 2000);
    if (!place) throw new ConvexError("Place is required.");
    
    validateDates(args.dates, args.isTwoDay);
    validateSlots(args.slots);

    const { token, place: _p, dressCodeNotes: _d, ...rest } = args;
    const status = computeStatus(args.dates);

    const cateringId = await ctx.db.insert("caterings", {
      ...rest,
      place,
      dressCodeNotes,
      title: place,
      status,
      createdAt: Date.now(),
    });

    // Create notification
    await ctx.db.insert("notifications", {
      type: "catering",
      category: "global",
      title: "New Event",
      message: `New event at ${place}`,
      cateringId,
      cateringTitle: place,
      cateringDate: args.dates[0],
      isRead: false,
      createdAt: Date.now(),
    });

    return cateringId;
  },
});

export const updateCatering = mutation({
  args: {
    cateringId: v.id("caterings"),
    place: v.optional(v.string()),
    timeOfDay: v.optional(v.union(v.literal("day"), v.literal("night"))),
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
    await checkPermission(ctx, token, "manage_caterings");

    const existing = await ctx.db.get(cateringId);
    if (!existing) throw new ConvexError("Event not found.");
    if (existing.status === "cancelled") throw new ConvexError("Cannot edit a cancelled event.");

    const sanitized = {};
    if (updates.place !== undefined) {
      sanitized.place = sanitizeString(updates.place).slice(0, 200);
      sanitized.title = sanitized.place;
      if (!sanitized.place) throw new ConvexError("Place cannot be empty.");
    }
    if (updates.dressCodeNotes !== undefined) {
      sanitized.dressCodeNotes = sanitizeString(updates.dressCodeNotes).slice(0, 2000);
    }
    if (updates.slots !== undefined) {
      validateSlots(updates.slots);
      sanitized.slots = updates.slots;
    }
    if (updates.timeOfDay !== undefined) sanitized.timeOfDay = updates.timeOfDay;
    if (updates.specificTime !== undefined) sanitized.specificTime = updates.specificTime;
    if (updates.photoRequired !== undefined) sanitized.photoRequired = updates.photoRequired;

    await ctx.db.patch(cateringId, sanitized);

    // Create notification for major updates
    if (sanitized.place || sanitized.specificTime) {
      await ctx.db.insert("notifications", {
        type: "catering",
        category: "global",
        title: "Event Updated",
        message: `Event at "${sanitized.place || existing.place}" has been updated. New Time: ${sanitized.specificTime || existing.specificTime}`,
        cateringId,
        cateringTitle: sanitized.place || existing.place,
        cateringDate: existing.dates[0],
        isRead: false,
        createdAt: Date.now(),
      });
    }
  },
});

export const cancelCatering = mutation({
  args: {
    cateringId: v.id("caterings"),
    token: v.string(),
  },
  handler: async (ctx, { cateringId, token }) => {
    await checkPermission(ctx, token, "manage_caterings");
    const existing = await ctx.db.get(cateringId);
    if (!existing) throw new ConvexError("Event not found.");
    if (existing.status === "cancelled") throw new ConvexError("Event is already cancelled.");
    if (existing.status === "ended") throw new ConvexError("Cannot cancel an event that has already ended.");
    await ctx.db.patch(cateringId, { status: "cancelled" });

    // Create notification
    await ctx.db.insert("notifications", {
      type: "catering",
      category: "global",
      title: "Event Cancelled",
      message: `Event at "${existing.place}" has been cancelled`,
      cateringId,
      cateringTitle: existing.place,
      cateringDate: existing.dates[0],
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const listCaterings = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    const caller = token ? await getUserFromToken(ctx, token) : null;
    
    // Helper for role checks
    const isAdmin = caller ? (caller.role === "admin" || caller.role === "sub_admin") : false;

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
  args: { cateringId: v.id("caterings"), token: v.optional(v.string()) },
  handler: async (ctx, { cateringId, token }) => {
    // Publicly accessible query
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
