import { v, ConvexError } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireAdmin, requireSubAdmin, getUserFromToken, checkPermission } from "./auth";

import { sanitizeString } from "./utils";

function computeStatus(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const eventDate = new Date(dateStr);
  eventDate.setHours(0, 0, 0, 0);

  if (eventDate < today) return "ended";
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

function validateDate(dateStr) {
  if (!dateStr) throw new ConvexError("Date is required.");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new ConvexError("Invalid date format.");
  if (d < today) throw new ConvexError("Cannot create an event for a past date.");
  
  const maxFuture = new Date();
  maxFuture.setFullYear(maxFuture.getFullYear() + 1);
  if (d > maxFuture) throw new ConvexError("Cannot schedule events more than 1 year in advance.");
}

export const createCatering = mutation({
  args: {
    title: v.string(),
    place: v.string(),
    timeOfDay: v.union(v.literal("day"), v.literal("night")),
    specificTime: v.string(),
    date: v.string(),
    photoRequired: v.boolean(),
    dressCodeNotes: v.string(),
    limitSlots: v.boolean(),
    slots: v.array(v.object({
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
    
    validateDate(args.date);
    validateSlots(args.slots);

    const { token, place: _p, dressCodeNotes: _d, ...rest } = args;
    const status = computeStatus(args.date);

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
      message: `${place} is now open for registration.`,
      cateringId,
      cateringTitle: place,
      cateringDate: args.date,
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
    date: v.optional(v.string()),
    photoRequired: v.optional(v.boolean()),
    dressCodeNotes: v.optional(v.string()),
    slots: v.optional(v.array(v.object({
      role: v.string(),
      limit: v.number(),
      pay: v.number(),
    }))),
    limitSlots: v.optional(v.boolean()),
    token: v.string(),
  },
  handler: async (ctx, { cateringId, token, ...updates }) => {
    await checkPermission(ctx, token, "manage_caterings");

    const existing = await ctx.db.get(cateringId);
    if (!existing) throw new ConvexError("Event not found.");
    if (existing.status === "cancelled") throw new ConvexError("Cannot edit a cancelled event.");
    if (existing.status === "ended") throw new ConvexError("Cannot edit an event that has already ended.");

    // Prevent edit if attendance has already been marked
    const attendanceTaken = await ctx.db
      .query("registrations")
      .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
      .filter((q) => q.neq(q.field("status"), "registered"))
      .first();

    if (attendanceTaken) {
      throw new ConvexError("Cannot edit an event once attendance has been started.");
    }

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
    if (updates.limitSlots !== undefined) sanitized.limitSlots = updates.limitSlots;
    if (updates.date !== undefined) {
      validateDate(updates.date);
      sanitized.date = updates.date;
      sanitized.status = computeStatus(updates.date);
    }

    await ctx.db.patch(cateringId, sanitized);

    // Create notification for major updates
    if (sanitized.place || sanitized.specificTime || sanitized.date) {
      await ctx.db.insert("notifications", {
        type: "catering",
        category: "global",
        title: "Event Update",
        message: `Event at ${sanitized.place || existing.place} has been updated.`,
        cateringId,
        cateringTitle: sanitized.place || existing.place,
        cateringDate: sanitized.date || existing.date,
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

    // Prevent cancellation if attendance has already been marked for anyone
    const attendanceTaken = await ctx.db
      .query("registrations")
      .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
      .filter((q) => q.neq(q.field("status"), "registered"))
      .first();

    if (attendanceTaken) {
      throw new ConvexError("Cannot cancel an event once attendance has been started.");
    }

    await ctx.db.patch(cateringId, { status: "cancelled" });

    // Create notification
    await ctx.db.insert("notifications", {
      type: "catering",
      category: "global",
      title: "Event Cancelled",
      message: `The event at ${existing.place} has been cancelled.`,
      cateringId,
      cateringTitle: existing.place,
      cateringDate: existing.date,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const startVerification = mutation({
  args: {
    cateringId: v.id("caterings"),
    token: v.string(),
  },
  handler: async (ctx, { cateringId, token }) => {
    await checkPermission(ctx, token, "manage_caterings");
    
    const catering = await ctx.db.get(cateringId);
    if (!catering) throw new ConvexError("Event not found.");
    if (catering.status === "cancelled" || catering.status === "ended") {
      throw new ConvexError("Cannot start verification for this event.");
    }

    const attendanceTaken = await ctx.db
      .query("registrations")
      .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
      .filter((q) => q.neq(q.field("status"), "registered"))
      .first();

    if (attendanceTaken) {
      throw new ConvexError("Cannot verify once attendance has been started.");
    }

    // Set event verification status to active
    await ctx.db.patch(cateringId, { 
      verificationStatus: "active",
      verificationDeadline: Date.now() + (48 * 60 * 60 * 1000)
    });

    // Reset all registered students to pending
    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
      .filter((q) => q.eq(q.field("status"), "registered"))
      .collect();

    for (const reg of registrations) {
      await ctx.db.patch(reg._id, { verificationStatus: "pending" });
    }

    return { success: true };
  },
});

export const listCaterings = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    const caller = token ? await getUserFromToken(ctx, token) : null;
    const isAdmin = caller ? (caller.role === "admin" || caller.role === "sub_admin") : false;

    const all = await ctx.db.query("caterings").order("desc").collect();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cateringsWithStats = [];
    for (const c of all) {
      const eventDateStr = c.date || (c.dates && c.dates[0]);
      if (!eventDateStr) continue;

      const eventDate = new Date(eventDateStr);
      eventDate.setHours(0, 0, 0, 0);
      if (c.status !== "cancelled" && eventDate < thirtyDaysAgo) continue;

      let stats = {};
      if (isAdmin) {
        if (c.registeredCount !== undefined && c.verifiedCount !== undefined) {
          stats = {
            registeredCount: c.registeredCount,
            verifiedCount: c.verifiedCount,
            // Still need to check attendanceStarted but that's cheaper if denormalized too?
            // For now, let's just use what's there or a small query if needed.
            // If we really want to optimize, we'd denormalize attendanceStarted too.
            attendanceStarted: c.registeredCount > 0 && c.verifiedCount > 0 // Heuristic or check first reg
          };
        } else {
          // Fallback for legacy
          const regs = await ctx.db
            .query("registrations")
            .withIndex("by_catering", (q) => q.eq("cateringId", c._id))
            .collect();
          
          stats = {
            registeredCount: regs.filter(r => r.status === "registered").length,
            verifiedCount: regs.filter(r => r.verificationStatus === "verified").length,
            attendanceStarted: regs.some(r => r.status !== "registered")
          };
        }
      }

      cateringsWithStats.push({ ...c, ...stats });
    }

    return cateringsWithStats;
  },
});

export const getCatering = query({
  args: { cateringId: v.id("caterings"), token: v.optional(v.string()) },
  handler: async (ctx, { cateringId, token }) => {
    const catering = await ctx.db.get(cateringId);
    if (!catering) return null;

    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
      .collect();

    return {
      ...catering,
      date: catering.date || (catering.dates && catering.dates[0]),
      attendanceStarted: regs.some(r => r.status !== "registered")
    };
  },
});

export const refreshStatuses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("caterings").collect();
    for (const c of all) {
      if (c.status === "cancelled") continue;
      const status = computeStatus(c.date);
      if (status !== c.status) {
        await ctx.db.patch(c._id, { status });
      }
    }
  },
});

export const getFinishedCaterings = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await checkPermission(ctx, token, "manage_payments");
    
    const caterings = await ctx.db
      .query("caterings")
      .filter((q) => 
        q.and(
          q.or(
            q.eq(q.field("status"), "ended"),
            q.eq(q.field("status"), "today"),
            q.eq(q.field("status"), "tomorrow")
          ),
          q.neq(q.field("status"), "cancelled")
        )
      )
      .order("desc")
      .collect();

    const result = [];
    for (const c of caterings) {
      const hasPending = await ctx.db
        .query("payments")
        .withIndex("by_catering", (q) => q.eq("cateringId", c._id))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .first();
      
      if (hasPending) {
        result.push(c);
      }
    }
    return result;
  },
});

export const setEventPayout = mutation({
  args: {
    cateringId: v.id("caterings"),
    payoutDate: v.string(),
    payoutNote: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, { cateringId, payoutDate, payoutNote, token }) => {
    await checkPermission(ctx, token, "manage_payments");
    
    await ctx.db.patch(cateringId, {
      payoutDate,
      payoutNote,
    });

    const catering = await ctx.db.get(cateringId);
    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
      .filter((q) => q.eq(q.field("status"), "attended"))
      .collect();

    for (const reg of registrations) {
      await ctx.db.insert("notifications", {
        type: "payment",
        category: "individual",
        title: "Payout",
        message: `Payout for ${catering.place} scheduled for ${payoutDate}`,
        targetUserId: reg.userId,
        cateringId: cateringId,
        cateringTitle: catering.place,
        isRead: false,
        createdAt: Date.now(),
      });
    }
  },
});

export const updateCounters = internalMutation({
  args: { cateringId: v.id("caterings") },
  handler: async (ctx, { cateringId }) => {
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
      .collect();

    await ctx.db.patch(cateringId, {
      registeredCount: regs.filter(r => r.status === "registered").length,
      verifiedCount: regs.filter(r => r.verificationStatus === "verified").length,
    });
  },
});
