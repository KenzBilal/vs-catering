import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSubAdmin, requireAdmin, getUserFromToken, checkPermission } from "./auth";

import { sanitizeString } from "./utils";

export const createPayment = mutation({
  args: {
    cateringId: v.id("caterings"),
    registrationId: v.id("registrations"),
    role: v.string(),
    amount: v.number(),
    method: v.union(v.literal("cash"), v.literal("upi")),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await checkPermission(ctx, args.token, "manage_payments");

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
    const paymentId = await ctx.db.insert("payments", {
      ...dataToInsert,
      userId,
      status: "pending",
      createdAt: Date.now(),
    });

    // Create notification
    const catering = await ctx.db.get(args.cateringId);

    await ctx.db.insert("notifications", {
      type: "payment",
      category: "individual",
      title: "Payment Pending",
      message: `₹${args.amount} is pending for your attendance.`,
      targetUserId: userId,
      paymentId,
      amount: args.amount,
      payoutDate: catering?.payoutDate,
      isRead: false,
      createdAt: Date.now(),
    });

    return paymentId;
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
    const adminUser = await checkPermission(ctx, token, "manage_payments");

    const payment = await ctx.db.get(paymentId);
    if (!payment) throw new ConvexError("Payment not found.");
    if (payment.status === "cleared") throw new ConvexError("Payment is already cleared.");

    await ctx.db.patch(paymentId, {
      status: "cleared",
      clearedBy: adminUser._id,
      clearedAt: Date.now(),
      ...(upiRef ? { upiRef: sanitizeString(upiRef).slice(0, 100) } : {}),
    });

    // Create notification
    await ctx.db.insert("notifications", {
      type: "payment",
      category: "individual",
      title: "Payment Cleared",
      message: `₹${payment.amount} has been paid to your account.`,
      targetUserId: payment.userId,
      paymentId: paymentId,
      amount: payment.amount,
      isRead: false,
      createdAt: Date.now(),
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
    await checkPermission(ctx, token, "manage_payments");
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
      .collect();

    const withUsers = await Promise.all(
      payments.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        const group = p.groupId ? await ctx.db.get(p.groupId) : null;
        let groupHead = null;
        if (group) {
          groupHead = await ctx.db.get(group.headUserId);
        }
        return { ...p, user, group, groupHead };
      })
    );
    return withUsers;
  },
});

export const createPaymentGroup = mutation({
  args: {
    cateringId: v.id("caterings"),
    headUserId: v.id("users"),
    memberRegIds: v.array(v.id("registrations")),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await checkPermission(ctx, args.token, "manage_payments");

    // 1. Calculate total amount and verify payments exist
    let totalAmount = 0;
    const paymentIds = [];
    
    for (const regId of args.memberRegIds) {
      const payment = await ctx.db
        .query("payments")
        .withIndex("by_registration", (q) => q.eq("registrationId", regId))
        .first();
      
      if (!payment) throw new ConvexError(`Payment record not found for registration ${regId}`);
      if (payment.status === "cleared") throw new ConvexError("Cannot group a payment that is already cleared.");
      if (payment.groupId) throw new ConvexError("One or more members are already in another group.");
      
      totalAmount += payment.amount;
      paymentIds.push(payment._id);
    }

    // 2. Create the group
    const groupId = await ctx.db.insert("paymentGroups", {
      cateringId: args.cateringId,
      headUserId: args.headUserId,
      memberRegIds: args.memberRegIds,
      totalAmount,
      status: "pending",
      createdAt: Date.now(),
    });

    // 3. Link payments to group
    for (const pid of paymentIds) {
      await ctx.db.patch(pid, { groupId });
    }

    return groupId;
  },
});

export const clearPaymentGroup = mutation({
  args: {
    groupId: v.id("paymentGroups"),
    token: v.string(),
  },
  handler: async (ctx, { groupId, token }) => {
    const admin = await checkPermission(ctx, token, "manage_payments");
    const group = await ctx.db.get(groupId);
    if (!group) throw new ConvexError("Group not found.");
    if (group.status === "cleared") throw new ConvexError("Group already cleared.");

    const now = Date.now();

    // 1. Clear the group
    await ctx.db.patch(groupId, {
      status: "cleared",
      clearedAt: now,
      clearedBy: admin._id,
    });

    // 2. Clear all linked payments and collect member names
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    const catering = await ctx.db.get(group.cateringId);
    const headUser = await ctx.db.get(group.headUserId);
    
    const memberNames = [];
    for (const p of payments) {
      const u = await ctx.db.get(p.userId);
      if (u) memberNames.push(u.name);
      
      await ctx.db.patch(p._id, {
        status: "cleared",
        clearedAt: now,
        clearedBy: admin._id,
      });
    }

    const memberList = memberNames.join(", ");

    for (const p of payments) {
      // Notify member
      const isHead = p.userId === group.headUserId;
      await ctx.db.insert("notifications", {
        type: "payment",
        category: "individual",
        title: isHead ? "Bulk Payment Received" : "Payment Sent to Head",
        message: isHead 
          ? `₹${group.totalAmount} has been paid to you for: ${memberList}.`
          : `₹${p.amount} for ${catering.place} has been paid to your group head (${headUser.name}).`,
        targetUserId: p.userId,
        paymentId: p._id,
        amount: p.amount,
        isRead: false,
        createdAt: now,
      });
    }

  },
});

export const disbandGroup = mutation({
  args: { groupId: v.id("paymentGroups"), token: v.string() },
  handler: async (ctx, { groupId, token }) => {
    await checkPermission(ctx, token, "manage_payments");
    const group = await ctx.db.get(groupId);
    if (!group || group.status === "cleared") throw new ConvexError("Cannot disband.");

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    for (const p of payments) {
      await ctx.db.patch(p._id, { groupId: undefined });
    }

    await ctx.db.delete(groupId);
  },
});

export const removeMemberFromPaymentGroup = mutation({
  args: { 
    groupId: v.id("paymentGroups"), 
    registrationId: v.id("registrations"), 
    token: v.string() 
  },
  handler: async (ctx, { groupId, registrationId, token }) => {
    await checkPermission(ctx, token, "manage_payments");
    const group = await ctx.db.get(groupId);
    if (!group || group.status === "cleared") throw new ConvexError("Cannot modify group.");

    if (group.headUserId === (await ctx.db.get(registrationId))?.userId) {
      throw new ConvexError("Cannot remove the team head. Disband the team instead.");
    }

    const payment = await ctx.db
      .query("payments")
      .withIndex("by_registration", (q) => q.eq("registrationId", registrationId))
      .first();
    
    if (payment && payment.groupId === groupId) {
      await ctx.db.patch(payment._id, { groupId: undefined });
      
      const newMembers = group.memberRegIds.filter(id => id !== registrationId);
      const newTotal = group.totalAmount - payment.amount;
      
      if (newMembers.length < 2) {
        // Only head left? Disband.
        for (const pid of (await ctx.db.query("payments").withIndex("by_group", q => q.eq("groupId", groupId)).collect())) {
          await ctx.db.patch(pid._id, { groupId: undefined });
        }
        await ctx.db.delete(groupId);
      } else {
        await ctx.db.patch(groupId, { 
          memberRegIds: newMembers,
          totalAmount: newTotal
        });
      }
    }
  },
});



export const getPendingPayments = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await checkPermission(ctx, token, "manage_payments");
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
    await checkPermission(ctx, token, "manage_payments");
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

    // Weekly trends for graphing
    const weeklyTrends = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = start + (i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000);
      const weekPayments = monthPayments.filter(p => p.createdAt >= weekStart && p.createdAt < weekEnd);
      weeklyTrends.push({
        week: i + 1,
        payout: weekPayments.filter(p => p.status === "cleared").reduce((s, p) => s + p.amount, 0),
        pending: weekPayments.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0),
      });
    }

    return {
      totalCaterings: monthCaterings.length,
      totalPayout,
      pendingPayout,
      uniqueStudents,
      paymentsCleared: monthPayments.filter((p) => p.status === "cleared").length,
      paymentsPending: monthPayments.filter((p) => p.status === "pending").length,
      weeklyTrends,
    };
  },
});


export const getStudentFinancialSummary = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getUserFromToken(ctx, token);
    if (!user) throw new ConvexError("Not authenticated.");

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const totalEarned = payments
      .filter((p) => p.status === "cleared")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = payments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    const recentPayments = await Promise.all(
      payments.slice(0, 5).map(async (p) => {
        const catering = await ctx.db.get(p.cateringId);
        return {
          ...p,
          cateringTitle: catering?.place || "Unknown Event",
          payoutDate: catering?.payoutDate,
        };
      })
    );

    return {
      totalEarned,
      pendingAmount,
      recentPayments,
    };
  },
});

