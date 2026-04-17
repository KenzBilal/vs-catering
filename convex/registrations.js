import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSubAdmin, getUserFromToken } from "./auth";

const VALID_ROLES = ["service_boy", "service_girl", "captain_male"];

function sanitize(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim().slice(0, maxLen);
}

export const register = mutation({
  args: {
    userId: v.id("users"),
    cateringId: v.id("caterings"),
    days: v.array(v.number()),
    role: v.string(),
    dropPoint: v.string(),
    photoUrl: v.optional(v.string()),
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

    return await ctx.db.insert("registrations", {
      userId: args.userId,
      cateringId: args.cateringId,
      days: args.days,
      role: args.role,
      dropPoint: sanitize(args.dropPoint, 100),
      ...(photoUrl ? { photoUrl } : {}),
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
        ? { rejectionReason: sanitize(rejectionReason, 300) }
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
    await requireSubAdmin(ctx, token);
    await ctx.db.patch(registrationId, { role });
  },
});
