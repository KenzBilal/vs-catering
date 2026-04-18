import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSubAdmin, requireAdmin, getUserFromToken } from "./auth";

import { sanitizeString } from "./utils";

export const createPayment = mutation({
  args: {
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

    if (args.amount < 0) throw new ConvexError("Payment amount cannot be negative.");

    // Derive userId from the registration record — never trust client
    const reg = await ctx.db.get(args.registrationId);
    if (!reg) throw new ConvexError("Registration not found.");
    const userId = reg.userId;

    // Prevent duplicate payment for same registration
    const duplicate = await ctx.db
      .query("payments")
      .withIndex("by_registration", (q) => q.eq("registrationId", args.registrationId))
      .first();
    if (duplicate) throw new ConvexError("A payment record already exists for this registration.");

    const { token, ...dataToInsert } = args;
    return await ctx.db.insert("payments", {
      ...dataToInsert,
      userId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});


export const clearPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    upiRef: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, { paymentId, upiRef, token }) => {
    // Derive clearedBy from session token — never trust the client
    const adminUser = await requireAdmin(ctx, token);

    const payment = await ctx.db.get(paymentId);
    if (!payment) throw new ConvexError("Payment not found.");
    if (payment.status === "cleared") throw new ConvexError("Payment is already cleared.");

    await ctx.db.patch(paymentId, {
      status: "cleared",
      clearedBy: adminUser._id,
      clearedAt: Date.now(),
      ...(upiRef ? { upiRef: sanitizeString(upiRef).slice(0, 100) } : {}),
    });
  },
});

export const getPaymentsByUser = query({
  args: { userId: v.id("users"), token: v.string() },
  handler: async (ctx, { userId, token }) => {
    const caller = await getUserFromToken(ctx, token);
    if (!caller) throw new ConvexError("Not authenticated.");

    // Self or admin/sub-admin
    if (caller._id !== userId && caller.role !== "admin" && caller.role !== "sub_admin") {
      throw new ConvexError("Unauthorized access.");
    }

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
  args: { cateringId: v.id("caterings"), token: v.string() },
  handler: async (ctx, { cateringId, token }) => {
    await requireSubAdmin(ctx, token);
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
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireSubAdmin(ctx, token);
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
  args: { month: v.number(), year: v.number(), token: v.string() },
  handler: async (ctx, { month, year, token }) => {
    await requireSubAdmin(ctx, token);
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
