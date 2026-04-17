import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSubAdmin, getUserFromToken } from "./auth";

import { sanitizeString } from "./utils";

const VALID_ROLES = ["service_boy", "service_girl", "captain_male", "captain_female"];

export const register = mutation({
  args: {
    userId: v.id("users"),
    cateringId: v.id("caterings"),
    days: v.array(v.number()),
    role: v.string(),
    dropPoint: v.string(),
    photoUrl: v.optional(v.string()), // Legacy
    photoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Validate role is a known enum value
    if (!VALID_ROLES.includes(args.role)) {
      throw new Error("Invalid role selected.");
    }

    // Get catering and verify it's open for registration
    const catering = await ctx.db.get(args.cateringId);
    if (!catering) throw new Error("Event not found.");
    if (catering.status === "ended") throw new Error("This event has ended. Registration is closed.");
    if (catering.status === "cancelled") throw new Error("This event has been cancelled.");

    // Check for duplicate registration
    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_user_catering", (q) =>
        q.eq("userId", args.userId).eq("cateringId", args.cateringId)
      )
      .first();
    if (existing) throw new Error("You are already registered for this event.");

    // Sanitize photo URL (basic check)
    let photoUrl = args.photoUrl;
    if (photoUrl) {
      photoUrl = photoUrl.trim().slice(0, 1000);
      // Only allow http/https URLs
      if (!/^https?:\/\/.+/.test(photoUrl)) throw new Error("Photo URL must be a valid http/https link.");
    }

    // Count existing registrations for queue position
    const allRegs = await ctx.db
      .query("registrations")
      .withIndex("by_catering", (q) => q.eq("cateringId", args.cateringId))
      .collect();

    const sameRoleRegs = allRegs.filter((r) => r.role === args.role);
    const queuePosition = sameRoleRegs.length + 1;

    const slot = catering.slots.find(
      (s) => s.role === args.role && s.day === args.days[0]
    );
    const isConfirmed = slot ? queuePosition <= slot.limit : false;

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User find failed.");

    // Enforce gender-based role restrictions
    if (user.gender === "male") {
      if (args.role !== "service_boy" && args.role !== "captain_male") {
        throw new Error("Males can only register as Service Boy or Captain.");
      }
    } else if (user.gender === "female") {
      if (args.role !== "service_girl" && args.role !== "captain_female") {
        throw new Error("Females can only register as Service Girl.");
      }
    }

    // Logic for persistent photo
    let finalPhotoStorageId = args.photoStorageId;
    if (finalPhotoStorageId && !user.photoStorageId) {
      // Save newly uploaded photo to user profile for future use
      await ctx.db.patch(args.userId, { photoStorageId: finalPhotoStorageId });
    } else if (!finalPhotoStorageId && user.photoStorageId) {
      // Use existing photo from profile
      finalPhotoStorageId = user.photoStorageId;
    }

    return await ctx.db.insert("registrations", {
      userId: args.userId,
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
      ...(rejectionReason
        ? { rejectionReason: sanitizeString(rejectionReason).slice(0, 300) }
        : {}),
    });
  },
});

export const changeRole = mutation({
  args: {
    registrationId: v.id("registrations"),
    role: v.string(),
    token: v.string(),
  },
  handler: async (ctx, { registrationId, role, token }) => {
    if (!VALID_ROLES.includes(role)) throw new Error("Invalid role.");
    const reg = await ctx.db.get(registrationId);
    if (!reg) throw new Error("Registration not found.");
    const user = await ctx.db.get(reg.userId);
    if (!user) throw new Error("User not found.");

    if (user.gender === "male") {
      if (role !== "service_boy" && role !== "captain_male") {
        throw new Error("Male students can only be assigned to Service Boy or Captain roles.");
      }
    } else if (user.gender === "female") {
      if (role !== "service_girl" && role !== "captain_female") {
        throw new Error("Female students can only be assigned to Service Girl roles.");
      }
    }

    await ctx.db.patch(registrationId, { role });
  },
});

export const cancelRegistration = mutation({
  args: {
    registrationId: v.id("registrations"),
    token: v.string(),
  },
  handler: async (ctx, { registrationId, token }) => {
    // Verify caller owns this registration
    const caller = await getUserFromToken(ctx, token);
    if (!caller) throw new Error("Not authenticated.");

    const reg = await ctx.db.get(registrationId);
    if (!reg) throw new Error("Registration not found.");
    if (reg.userId !== caller._id) throw new Error("You can only cancel your own registration.");

    // Block cancellation if event has already ended or attendance was marked
    const catering = await ctx.db.get(reg.cateringId);
    if (catering?.status === "ended") throw new Error("This event has already ended.");
    if (reg.status === "attended") throw new Error("Cannot cancel — you have already been marked as attended.");

    await ctx.db.delete(registrationId);
  },
});
