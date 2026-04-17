import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    // Check if already registered
    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_user_catering", (q) =>
        q.eq("userId", args.userId).eq("cateringId", args.cateringId)
      )
      .first();
    if (existing) throw new Error("Already registered for this catering.");

    // Count existing registrations for this role+day to determine queue position
    const allRegs = await ctx.db
      .query("registrations")
      .withIndex("by_catering", (q) => q.eq("cateringId", args.cateringId))
      .collect();

    const sameRoleRegs = allRegs.filter((r) => r.role === args.role);
    const queuePosition = sameRoleRegs.length + 1;

    // Get catering to check slot limit
    const catering = await ctx.db.get(args.cateringId);
    const slot = catering.slots.find(
      (s) => s.role === args.role && s.day === args.days[0]
    );
    const isConfirmed = slot ? queuePosition <= slot.limit : false;

    return await ctx.db.insert("registrations", {
      ...args,
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
  },
  handler: async (ctx, { registrationId, status, rejectionReason }) => {
    await ctx.db.patch(registrationId, {
      status,
      ...(rejectionReason ? { rejectionReason } : {}),
    });
  },
});

export const changeRole = mutation({
  args: {
    registrationId: v.id("registrations"),
    role: v.string(),
  },
  handler: async (ctx, { registrationId, role }) => {
    await ctx.db.patch(registrationId, { role });
  },
});
