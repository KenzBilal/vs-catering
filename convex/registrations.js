import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSubAdmin, getUserFromToken, checkPermission, getAllAdmins } from "./auth";

import { sanitizeString } from "./utils";
import { syncCateringCounters } from "./caterings_util";

const VALID_ROLES = ["service_boy", "service_girl", "captain_male", "captain_female"];
// ─── register — userId derived from token (fixes #4) ──────────────────────────

export const register = mutation({


  args: {
    token: v.string(),
    cateringId: v.id("caterings"),
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
    
    // Check registration deadline if set
    if (catering.registrationDeadline && Date.now() > catering.registrationDeadline) {
      throw new ConvexError("Registration for this event has closed (deadline passed).");
    }

    if (catering.status === "ended") throw new ConvexError("This event has ended. Registration is closed.");
    if (catering.status === "cancelled") throw new ConvexError("This event has been cancelled.");

    // Mandatory Email Verification Check
    if (!caller.emailVerified) {
      throw new ConvexError("Please verify your email address before registering for events.");
    }

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

    // #15: Queue position is per-role (Optimized with index)
    const sameRoleDayRegs = await ctx.db
      .query("registrations")
      .withIndex("by_catering_role", (q) => q.eq("cateringId", args.cateringId).eq("role", args.role))
      .collect();
    
    const maxPos = sameRoleDayRegs.reduce((max, r) => Math.max(max, r.queuePosition || 0), 0);
    const queuePosition = maxPos + 1;

    const slot = catering.slots.find((s) => s.role === args.role);
    
    // Conditional confirmation logic based on limitSlots toggle
    let isConfirmed = true;
    if (catering.limitSlots) {
      isConfirmed = slot ? queuePosition <= slot.limit : false;
    }

    // Gender-based role restrictions
    if (caller.gender === "male") {
      if (args.role !== "service_boy" && args.role !== "captain_male") {
        throw new ConvexError("Males can only register as Service Boy or Captain.");
      }
    } else if (caller.gender === "female") {
      if (args.role !== "service_girl" && args.role !== "captain_female") {
        throw new ConvexError("Females can only register as Service Girl or Captain.");
      }
    } else {
      throw new ConvexError("Your profile is missing gender information. Please update your profile before registering.");
    }

    // Persistent photo: save new upload to profile or reuse existing
    let finalPhotoStorageId = args.photoStorageId;
    if (finalPhotoStorageId && finalPhotoStorageId !== caller.photoStorageId) {
      // If user had an old photo, delete it to save space
      if (caller.photoStorageId) {
        try {
          await ctx.storage.delete(caller.photoStorageId);
        } catch (e) {
          console.error("Failed to delete old photo during registration:", e);
        }
      }
      await ctx.db.patch(caller._id, { photoStorageId: finalPhotoStorageId });
    } else if (!finalPhotoStorageId && caller.photoStorageId) {
      finalPhotoStorageId = caller.photoStorageId;
    }

    // #24: Strict photo requirement check
    if (catering.photoRequired && !finalPhotoStorageId && !args.photoUrl) {
      throw new ConvexError("This event requires a profile photo. Please upload one before registering.");
    }

    const registrationId = await ctx.db.insert("registrations", {
      userId: caller._id,
      cateringId: args.cateringId,
      role: args.role,
      dropPoint: sanitizeString(args.dropPoint).slice(0, 100),
      ...(photoUrl ? { photoUrl } : {}),
      ...(finalPhotoStorageId ? { photoStorageId: finalPhotoStorageId } : {}),
      queuePosition,
      isConfirmed,
      status: "registered",
      createdAt: Date.now(),
    });

    // Notify Admins
    if (caller.role !== "admin" && caller.role !== "sub_admin") {
      const admins = await getAllAdmins(ctx);
      for (const admin of admins) {
        await ctx.db.insert("notifications", {
          type: "catering",
          category: "individual",
          title: "Registration",
          message: `${caller.name} registered for ${catering.place} as ${args.role.replace("_", " ")}`,
          targetUserId: admin._id,
          cateringId: args.cateringId,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    await syncCateringCounters(ctx, args.cateringId);
    return registrationId;

  },
});

// ─── getRegistrationsByCatering ───────────────────────────────────────────────

export const getRegistrationsByCatering = query({
  args: { cateringId: v.id("caterings"), token: v.string() },
  handler: async (ctx, { cateringId, token }) => {
    const caller = await getUserFromToken(ctx, token);
    if (!caller) throw new ConvexError("Unauthorized: Authentication required to view participant list.");
    
    const isAdmin = caller ? (caller.role === "admin" || caller.role === "sub_admin") : false;

    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
      .collect();
    
    // Optimization: Batch fetch users
    const userIds = [...new Set(regs.map(r => r.userId))];
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
    const userMap = new Map(users.filter(u => u).map(u => [u._id, u]));

    // Optimization: Batch fetch payments
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
      .collect();
    const paymentMap = new Map(payments.map(p => [p.registrationId, p]));

    const withUsers = regs.map((r) => {
        const user = userMap.get(r.userId);
        if (!user) return null;

        const payment = paymentMap.get(r._id);
        const base = { ...r, user, paymentStatus: payment?.status || "pending" };

        // If not admin, hide sensitive data
        if (!isAdmin) {
          return {
            _id: r._id,
            userId: r.userId,
            role: r.role,
            isConfirmed: r.isConfirmed,
            status: r.status,
            dropPoint: r.dropPoint,
            paymentStatus: base.paymentStatus,
            user: {
              name: user.name,
              photoStorageId: user.photoStorageId,
            }
          };
        }

        return base;
      });


    return withUsers.filter(r => r !== null);
  },
});

// ─── getRegistrationsByUser ───────────────────────────────────────────────────

export const getRegistrationsByUser = query({
  args: { userId: v.id("users"), token: v.string() },
  handler: async (ctx, { userId, token }) => {
    const caller = await getUserFromToken(ctx, token);
    if (!caller) throw new ConvexError("Not authenticated.");
    
    // Authorization: User can see their own, or admin can see any
    if (caller._id !== userId && caller.role !== "admin" && caller.role !== "sub_admin") {
      throw new ConvexError("Unauthorized access.");
    }

    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    // Optimized Batch Fetch
    const userIds = [...new Set(payments.map(p => p.userId))];
    const cateringIds = [...new Set(payments.map(p => p.cateringId))];
    const [users, allCaterings] = await Promise.all([
      Promise.all(userIds.map(id => ctx.db.get(id))),
      Promise.all(cateringIds.map(id => ctx.db.get(id)))
    ]);

    const userMap = new Map(users.filter(u => u).map(u => [u._id, u]));
    const cateringMap = new Map(allCaterings.filter(c => c).map(c => [c._id, c]));

    return payments.map(p => ({
      ...p,
      user: userMap.get(p.userId),
      catering: cateringMap.get(p.cateringId)
    }));
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
    await checkPermission(ctx, token, "mark_attendance");

    const reg = await ctx.db.get(registrationId);
    if (!reg) throw new ConvexError("Registration not found.");
    const catering = await ctx.db.get(reg.cateringId);
    if (!catering) throw new ConvexError("Event not found.");

    if (catering.payoutDate) {
      throw new ConvexError("Cannot change attendance after a payout date has been scheduled for this event.");
    }

    const existingPayment = await ctx.db
      .query("payments")
      .withIndex("by_registration", (q) => q.eq("registrationId", registrationId))
      .filter((q) => q.eq(q.field("status"), "cleared"))
      .first();

    if (existingPayment) {
      throw new ConvexError("Cannot change attendance after payment has been cleared.");
    }

    await ctx.db.patch(registrationId, {

      status,
      // #16: Clear isConfirmed when rejected or absent
      ...(status === "rejected" || status === "absent" ? { isConfirmed: false } : {}),
      ...(rejectionReason
        ? { rejectionReason: sanitizeString(rejectionReason).slice(0, 300) }
        : {}),
    });
    await syncCateringCounters(ctx, reg.cateringId);

    // AUTO-PAYMENT: Create pending payment when marked as attended
    if (status === "attended") {
      const existingPayment = await ctx.db
        .query("payments")
        .withIndex("by_registration", (q) => q.eq("registrationId", registrationId))
        .first();

      if (!existingPayment) {
        const reg = await ctx.db.get(registrationId);
        const catering = await ctx.db.get(reg.cateringId);
        const slot = catering.slots.find(s => s.role === reg.role);
        const amount = slot?.pay || 0;

        const paymentId = await ctx.db.insert("payments", {
          userId: reg.userId,
          cateringId: reg.cateringId,
          registrationId: reg._id,
          role: reg.role,
          amount: amount,
          method: "cash", // Default to cash, admin can change later
          status: "pending",
          createdAt: Date.now(),
        });

        // Notify student
        await ctx.db.insert("notifications", {
          type: "payment",
          category: "individual",
          title: "Payment Pending",
          message: `₹${amount} is pending for your attendance at ${catering.place}.`,
          targetUserId: reg.userId,
          paymentId,
          amount: amount,
          payoutDate: catering?.payoutDate,
          isRead: false,
          createdAt: Date.now(),
        });
      }
      
      // Explicit Attendance Notification
      const regFinal = await ctx.db.get(registrationId);
      const catFinal = await ctx.db.get(regFinal.cateringId);
      await ctx.db.insert("notifications", {
        type: "catering",
        category: "individual",
        title: "Attendance Updated",
        message: `Your status has been updated to ${status} for ${catFinal.place}`,
        targetUserId: regFinal.userId,
        cateringId: regFinal.cateringId,
        isRead: false,
        createdAt: Date.now(),
      });
    } else {
      // If changed to absent/rejected, delete any PENDING payment to avoid orphaned records
      const pendingPayment = await ctx.db
        .query("payments")
        .withIndex("by_registration", (q) => q.eq("registrationId", registrationId))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .first();

      if (pendingPayment) {
        if (pendingPayment.groupId) {
          throw new ConvexError("Cannot change attendance: Member is part of a payment group. Disband the group first.");
        }
        await ctx.db.delete(pendingPayment._id);
      }

      // Explicit Attendance Notification
      const regFinal = await ctx.db.get(registrationId);
      const catFinal = await ctx.db.get(regFinal.cateringId);
      await ctx.db.insert("notifications", {
        type: "catering",
        category: "individual",
        title: "Attendance Updated",
        message: `Your status has been updated to ${status} for ${catFinal.place}`,
        targetUserId: regFinal.userId,
        cateringId: regFinal.cateringId,
        isRead: false,
        createdAt: Date.now(),
      });
    }
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
    await checkPermission(ctx, token, "mark_attendance");
    if (!VALID_ROLES.includes(role)) throw new ConvexError("Invalid role.");
    const reg = await ctx.db.get(registrationId);
    if (!reg) throw new ConvexError("Registration not found.");
    const user = await ctx.db.get(reg.userId);
    if (!user) throw new ConvexError("User not found.");

    const catering = await ctx.db.get(reg.cateringId);
    if (catering?.payoutDate) {
      throw new ConvexError("Cannot change role after a payout date has been scheduled for this event.");
    }

    // Prevent change if individual payment cleared
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_registration", (q) => q.eq("registrationId", registrationId))
      .filter((q) => q.eq(q.field("status"), "cleared"))
      .first();

    if (payment) {
      throw new ConvexError("Cannot change role once payment has been cleared.");
    }


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

    // AUTO-PAYMENT ADJUSTMENT: If student is attended and has a pending payment, update the amount
    const updatedReg = await ctx.db.get(registrationId);
    if (updatedReg.status === "attended") {
      const payment = await ctx.db
        .query("payments")
        .withIndex("by_registration", (q) => q.eq("registrationId", registrationId))
        .first();
      
      if (payment && payment.status === "pending") {
        const catering = await ctx.db.get(updatedReg.cateringId);
        const slot = catering.slots.find(s => s.role === role);
        const newAmount = slot?.pay || 0;

        if (payment.amount !== newAmount) {
          const oldAmount = payment.amount;
          await ctx.db.patch(payment._id, { 
            amount: newAmount,
            role: role 
          });

          // Reconcile group total if member is part of a payout group
          if (payment.groupId) {
            const group = await ctx.db.get(payment.groupId);
            if (group) {
              await ctx.db.patch(group._id, {
                totalAmount: (group.totalAmount - oldAmount) + newAmount
              });
            }
          }

          // Notify student of adjustment
          await ctx.db.insert("notifications", {
            type: "payment",
            category: "individual",
            title: "Payout",
            message: `Payout for ${catering.place} set for ${catering.payoutDate}`,
            targetUserId: updatedReg.userId,
            paymentId: payment._id,
            amount: newAmount,
            isRead: false,
            createdAt: Date.now(),
          });
        }
      }
    }

    // Create notification for role change itself
    await ctx.db.insert("notifications", {
      type: "role",
      category: "individual",
      title: "Role Change",
      message: `Role updated to ${role.replace("_", " ")} for ${catering?.place || "Event"}`,
      targetUserId: reg.userId,
      targetUserName: user.name,
      isRead: false,
      createdAt: Date.now(),
    });
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
    
    if (reg.status !== "registered") {
      throw new ConvexError(`Cannot cancel registration once you have been marked as ${reg.status}.`);
    }

    const wasConfirmed = reg.isConfirmed;
    await ctx.db.delete(registrationId);
    await syncCateringCounters(ctx, reg.cateringId);

    // Notify Admins of Cancellation
    const admins = await getAllAdmins(ctx);
    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        type: "catering",
        category: "individual",
        title: "Cancelled",
        message: `${caller.name} withdrawn from ${catering?.place || "Event"}`,
        targetUserId: admin._id,
        cateringId: reg.cateringId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    // #19: Waitlist promotion — only if limitSlots is true
    if (catering?.limitSlots && wasConfirmed) {
      const slot = catering?.slots.find((s) => s.role === reg.role);
      if (slot) {
        // Find all unconfirmed registrations for same role, order by queuePosition
        const allRegs = await ctx.db
          .query("registrations")
          .withIndex("by_catering", (q) => q.eq("cateringId", reg.cateringId))
          .collect();
          
        const waitlisted = allRegs
          .filter((r) => r.role === reg.role && !r.isConfirmed)
          .sort((a, b) => a.queuePosition - b.queuePosition);

        const confirmedCount = allRegs.filter(
          (r) => r.role === reg.role && r.isConfirmed
        ).length;

        if (waitlisted.length > 0 && confirmedCount < slot.limit) {
          const promotedUser = await ctx.db.get(waitlisted[0].userId);
          await ctx.db.patch(waitlisted[0]._id, { isConfirmed: true });
          
          // Notify the student they've been promoted
          await ctx.db.insert("notifications", {
            type: "catering",
            category: "individual",
            title: "Waitlist Promotion",
            message: `You have been promoted from the waitlist for ${catering.place}. You are now confirmed!`,
            targetUserId: waitlisted[0].userId,
            cateringId: catering._id,
            isRead: false,
            createdAt: Date.now(),
          });
        }
      }
    }
  },
});

export const verifyAttendance = mutation({
  args: {
    registrationId: v.id("registrations"),
    verified: v.boolean(),
    token: v.string(),
  },
  handler: async (ctx, { registrationId, verified, token }) => {
    const user = await getUserFromToken(ctx, token);
    const reg = await ctx.db.get(registrationId);
    
    if (!user || !reg || reg.userId !== user._id) {
      throw new ConvexError("Unauthorized.");
    }

    if (verified) {
      await ctx.db.patch(registrationId, { verificationStatus: "verified" });
    } else {
      await ctx.db.patch(registrationId, { verificationStatus: "withdrawn" });
      
      // Notify admins of withdrawal
      const admins = await getAllAdmins(ctx);
      const catering = await ctx.db.get(reg.cateringId);
      
      for (const admin of admins) {
        await ctx.db.insert("notifications", {
          type: "catering",
          category: "individual",
          title: "Withdrawal",
          message: `${user.name} withdrew from ${catering?.place} during verification.`,
          targetUserId: admin._id,
          cateringId: reg.cateringId,
          cateringTitle: catering?.place,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    await syncCateringCounters(ctx, reg.cateringId);
    return { success: true };
  },
});

export const getPendingVerification = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getUserFromToken(ctx, token);
    if (!user) return null;

    // Find a registration where verification is pending
    const reg = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("verificationStatus"), "pending"),
          q.eq(q.field("status"), "registered")
        )
      )
      .first();
    
    if (!reg) return null;

    const catering = await ctx.db.get(reg.cateringId);
    if (!catering || catering.status === "cancelled" || catering.status === "ended") return null;

    return {
      registrationId: reg._id,
      cateringPlace: catering.place,
      cateringId: catering._id
    };
  },
});
