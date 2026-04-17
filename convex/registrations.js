import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSubAdmin, getUserFromToken } from "./auth";

import { sanitizeString } from "./utils";

const VALID_ROLES = ["service_boy", "service_girl", "captain_male", "captain_female"];

// ─── register — userId derived from token (fixes #4) ──────────────────────────

export const register = mutation({
  args: {
    token: v.string(),
    cateringId: v.id("caterings"),
    days: v.array(v.number()),
    role: v.string(),
    dropPoint: v.string(),
    photoUrl: v.optional(v.string()), // Legacy
    photoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Derive caller from session token — never trust client-supplied userId
    const caller = await getUserFromToken(ctx, args.token);
    if (!caller) throw new ConvexError("Not authenticated.");

    if (!VALID_ROLES.includes(args.role)) throw new ConvexError("Invalid role selected.");

    const catering = await ctx.db.get(args.cateringId);
    if (!catering) throw new ConvexError("Event not found.");
    if (catering.status === "ended") throw new ConvexError("This event has ended. Registration is closed.");
    if (catering.status === "cancelled") throw new ConvexError("This event has been cancelled.");

    // Duplicate check
    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_user_catering", (q) =>
        q.eq("userId", caller._id).eq("cateringId", args.cateringId)
      )
      .first();
    if (existing) throw new ConvexError("You are already registered for this event.");

    // Sanitize photo URL
    let photoUrl = args.photoUrl;
    if (photoUrl) {
      photoUrl = photoUrl.trim().slice(0, 1000);
      if (!/^https?:\/\/.+/.test(photoUrl)) throw new ConvexError("Photo URL must be a valid http/https link.");
    }

    // #15: Queue position is per-role per-day (not global across all days)
    const primaryDay = args.days[0];
    const allRegsForSlot = await ctx.db
      .query("registrations")
      .withIndex("by_catering", (q) => q.eq("cateringId", args.cateringId))
      .collect();
    const sameRoleDayRegs = allRegsForSlot.filter((r) => r.role === args.role && r.days.includes(primaryDay));
    const queuePosition = sameRoleDayRegs.length + 1;

    const slot = catering.slots.find((s) => s.role === args.role && s.day === primaryDay);
    const isConfirmed = slot ? queuePosition <= slot.limit : false;

    // Gender-based role restrictions
    if (caller.gender === "male") {
      if (args.role !== "service_boy" && args.role !== "captain_male") {
        throw new ConvexError("Males can only register as Service Boy or Captain.");
      }
    } else if (caller.gender === "female") {
      if (args.role !== "service_girl" && args.role !== "captain_female") {
        throw new ConvexError("Females can only register as Service Girl or Captain.");
      }
    }

    // Persistent photo: save new upload to profile or reuse existing
    let finalPhotoStorageId = args.photoStorageId;
    if (finalPhotoStorageId && !caller.photoStorageId) {
      await ctx.db.patch(caller._id, { photoStorageId: finalPhotoStorageId });
    } else if (!finalPhotoStorageId && caller.photoStorageId) {
      finalPhotoStorageId = caller.photoStorageId;
    }

    return await ctx.db.insert("registrations", {
      userId: caller._id,
      cateringId: args.cateringId,
      days: args.days,
      role: args.role,
      dropPoint: sanitizeString(args.dropPoint).slice(0, 100),
      ...(photoUrl ? { photoUrl } : {}),
      ...(finalPhotoStorageId ? { photoStorageId: finalPhotoStorageId } : {}),
      queuePosition,
      isConfirmed,
      status: "registered",
      createdAt: Date.now(),
    });
  },
});

// ─── getRegistrationsByCatering ───────────────────────────────────────────────

export const getRegistrationsByCatering = query({
  args: { cateringId: v.id("caterings") },
  handler: async (ctx, { cateringId }) => {
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
      .collect();
    const withUsers = await Promise.all(
      regs.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return { ...r, user };
      })
    );
    return withUsers;
  },
});

// ─── getRegistrationsByUser ───────────────────────────────────────────────────

export const getRegistrationsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const withCaterings = await Promise.all(
      regs.map(async (r) => {
        const catering = await ctx.db.get(r.cateringId);
        return { ...r, catering };
      })
    );
    return withCaterings;
  },
});

// ─── markAttendance — fixes #16: set isConfirmed=false on rejection ───────────

export const markAttendance = mutation({
  args: {
    registrationId: v.id("registrations"),
    status: v.union(
      v.literal("attended"),
      v.literal("rejected"),
      v.literal("absent")
    ),
    rejectionReason: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, { registrationId, status, rejectionReason, token }) => {
    await requireSubAdmin(ctx, token);
    await ctx.db.patch(registrationId, {
      status,
      // #16: Clear isConfirmed when rejected or absent
      ...(status === "rejected" || status === "absent" ? { isConfirmed: false } : {}),
      ...(rejectionReason
        ? { rejectionReason: sanitizeString(rejectionReason).slice(0, 300) }
        : {}),
    });
  },
});

// ─── changeRole ───────────────────────────────────────────────────────────────

export const changeRole = mutation({
  args: {
    registrationId: v.id("registrations"),
    role: v.string(),
    token: v.string(),
  },
  handler: async (ctx, { registrationId, role, token }) => {
    if (!VALID_ROLES.includes(role)) throw new ConvexError("Invalid role.");
    const reg = await ctx.db.get(registrationId);
    if (!reg) throw new ConvexError("Registration not found.");
    const user = await ctx.db.get(reg.userId);
    if (!user) throw new ConvexError("User not found.");

    if (user.gender === "male") {
      if (role !== "service_boy" && role !== "captain_male") {
        throw new ConvexError("Male students can only be assigned to Service Boy or Captain roles.");
      }
    } else if (user.gender === "female") {
      if (role !== "service_girl" && role !== "captain_female") {
        throw new ConvexError("Female students can only be assigned to Service Girl or Captain roles.");
      }
    }

    await ctx.db.patch(registrationId, { role });
  },
});

// ─── cancelRegistration — with waitlist promotion (fixes #19) ─────────────────

export const cancelRegistration = mutation({
  args: {
    registrationId: v.id("registrations"),
    token: v.string(),
  },
  handler: async (ctx, { registrationId, token }) => {
    const caller = await getUserFromToken(ctx, token);
    if (!caller) throw new ConvexError("Not authenticated.");

    const reg = await ctx.db.get(registrationId);
    if (!reg) throw new ConvexError("Registration not found.");
    if (reg.userId !== caller._id) throw new ConvexError("You can only cancel your own registration.");

    const catering = await ctx.db.get(reg.cateringId);
    if (catering?.status === "ended") throw new ConvexError("This event has already ended.");
    if (reg.status === "attended") throw new ConvexError("Cannot cancel — you have already been marked as attended.");

    const wasConfirmed = reg.isConfirmed;
    await ctx.db.delete(registrationId);

    // #19: Waitlist promotion — if this was a confirmed slot, promote the next in queue
    if (wasConfirmed) {
      const slot = catering?.slots.find((s) => s.role === reg.role && s.day === reg.days[0]);
      if (slot) {
        // Find all unconfirmed registrations for same role/day, order by queuePosition
        const allRegs = await ctx.db
          .query("registrations")
          .withIndex("by_catering", (q) => q.eq("cateringId", reg.cateringId))
          .collect();
        const waitlisted = allRegs
          .filter((r) => r.role === reg.role && r.days.includes(reg.days[0]) && !r.isConfirmed)
          .sort((a, b) => a.queuePosition - b.queuePosition);

        if (waitlisted.length > 0) {
          await ctx.db.patch(waitlisted[0]._id, { isConfirmed: true });
        }
      }
    }
  },
});
