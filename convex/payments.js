import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSubAdmin, requireAdmin } from "./auth";

export const createPayment = mutation({
  args: {
    userId: v.id("users"),
    cateringId: v.id("caterings"),
    registrationId: v.id("registrations"),
    day: v.number(),
    role: v.string(),
    amount: v.number(),
    method: v.union(v.literal("cash"), v.literal("upi")),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireSubAdmin(ctx, args.token);
    const { token, ...dataToInsert } = args;
    return await ctx.db.insert("payments", {
      ...dataToInsert,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const clearPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    clearedBy: v.id("users"),
    upiRef: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, { paymentId, clearedBy, upiRef, token }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(paymentId, {
      status: "cleared",
      clearedBy,
      clearedAt: Date.now(),
      ...(upiRef ? { upiRef } : {}),
    });
  },
});

export const getPaymentsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const withDetails = await Promise.all(
      payments.map(async (p) => {
        const catering = await ctx.db.get(p.cateringId);
        return { ...p, catering };
      })
    );
    return withDetails;
  },
});

export const getPaymentsByCatering = query({
  args: { cateringId: v.id("caterings") },
  handler: async (ctx, { cateringId }) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
      .collect();

    const withUsers = await Promise.all(
      payments.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return { ...p, user };
      })
    );
    return withUsers;
  },
});

export const getPendingPayments = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const withDetails = await Promise.all(
      payments.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        const catering = await ctx.db.get(p.cateringId);
        return { ...p, user, catering };
      })
    );
    return withDetails;
  },
});

export const getMonthlyAnalytics = query({
  args: { month: v.number(), year: v.number() },
  handler: async (ctx, { month, year }) => {
    const start = new Date(year, month - 1, 1).getTime();
    const end = new Date(year, month, 1).getTime();

    const monthPayments = await ctx.db
      .query("payments")
      .withIndex("by_created", (q) => q.gte("createdAt", start).lt("createdAt", end))
      .collect();

    const monthCaterings = await ctx.db
      .query("caterings")
      .withIndex("by_created", (q) => q.gte("createdAt", start).lt("createdAt", end))
      .collect();

    const totalPayout = monthPayments
      .filter((p) => p.status === "cleared")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayout = monthPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    const uniqueStudents = new Set(monthPayments.map((p) => p.userId.toString())).size;

    return {
      totalCaterings: monthCaterings.length,
      totalPayout,
      pendingPayout,
      uniqueStudents,
      paymentsCleared: monthPayments.filter((p) => p.status === "cleared").length,
      paymentsPending: monthPayments.filter((p) => p.status === "pending").length,
    };
  },
});
