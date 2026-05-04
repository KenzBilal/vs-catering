import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, getAuthUser, checkPermission } from "./auth";
import { sanitizeString, validatePhone, validateEmail } from "./utils";

// ─── getCurrentUser ─────────────────────────────────────────────────────────


export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getAuthUser(ctx);
      return user || null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },
});

// Admin-only: list all users (secured)
export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const caller = await getAuthUser(ctx);
    if (!caller || caller.role !== "admin") throw new ConvexError("Unauthorized");
    const users = await ctx.db.query("users").collect();
    return users.map(u => ({ _id: u._id, email: u.email, name: u.name, role: u.role }));
  },
});



// ─── getUser ─────────────────────────────────────────────────────────────────
export const getUser = query({
  args: { userId: v.id("users"), token: v.optional(v.string()) },
  handler: async (ctx, { userId }) => {
    const caller = await getAuthUser(ctx);
    if (!caller) throw new ConvexError("Unauthorized");

    let canViewAll = false;
    if (caller.role === "admin" || caller.role === "sub_admin") canViewAll = true;

    if (caller._id !== userId && !canViewAll) {
      throw new ConvexError("Unauthorized: You can only view your own profile.");
    }

    return await ctx.db.get(userId);
  },
});

// Admin mutation to delete a user with cascade cleanup
export const deleteUser = mutation({
  args: { userId: v.id("users"), token: v.optional(v.string()) },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);

    // Cascade delete registrations
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const r of regs) {
      await ctx.db.delete(r._id);
    }

    // Cascade delete payments
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const p of payments) {
      await ctx.db.delete(p._id);
    }

    // Cleanup paymentGroups where user was head
    const groupsAsHead = await ctx.db
      .query("paymentGroups")
      .withIndex("by_head", (q) => q.eq("headUserId", userId))
      .collect();
    for (const g of groupsAsHead) {
      await ctx.db.delete(g._id);
    }

    await ctx.db.delete(userId);
  },
});

export const updateProfile = mutation({
  args: {
    phone: v.optional(v.string()),
    stayType: v.optional(v.union(v.literal("hostel"), v.literal("day_scholar"))),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    defaultDropPoint: v.optional(v.string()),
    name: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const caller = await getAuthUser(ctx);
    if (!caller) throw new ConvexError("Unauthorized");
    
    await ctx.db.patch(caller._id, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.phone !== undefined && { phone: args.phone }),
      ...(args.stayType !== undefined && { stayType: args.stayType }),
      ...(args.gender !== undefined && { gender: args.gender }),
      ...(args.defaultDropPoint !== undefined && { defaultDropPoint: args.defaultDropPoint }),
      role: caller.role || "student" // Ensure role exists
    });
  }
});

export const setUserRole = mutation({
  args: {
    token: v.optional(v.string()),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("sub_admin"), v.literal("student")),
  },
  handler: async (ctx, { userId, role }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(userId, { role });
    
    const user = await ctx.db.get(userId);
    await ctx.db.insert("notifications", {
      type: "role",
      category: "individual",
      title: "Account Updated",
      message: `Your account role has been updated to ${role.replace("_", " ")}.`,
      targetUserId: userId,
      targetUserName: user.name,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const updateAdminPreferences = mutation({
  args: {
    token: v.optional(v.string()),
    preferences: v.object({
      showAnalytics: v.boolean(),
      showPendingPayments: v.boolean(),
      showActiveEvents: v.boolean(),
    }),
  },
  handler: async (ctx, { preferences }) => {
    const caller = await getAuthUser(ctx);
    if (!caller || (caller.role !== "admin" && caller.role !== "sub_admin")) {
      throw new ConvexError("Unauthorized");
    }
    await ctx.db.patch(caller._id, { adminPreferences: preferences });
  },
});

export const getAllStudents = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx) => {
    const caller = await checkPermission(ctx, null, "manage_users");
    
    // Fallback: If caller isn't strictly sub_admin/admin, throw. (checkPermission handles this)
    const users = await ctx.db.query("users").collect();
    if (caller.role === "sub_admin") {
      return users.filter((u) => u.role === "student");
    }
    return users;
  },
});

export const checkUserExists = query({
  args: { email: v.string(), phone: v.string() },
  handler: async (ctx, { email, phone }) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    
    const byEmail = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", cleanEmail)).first();
    if (byEmail) return { exists: true };

    const byPhone = await ctx.db.query("users").withIndex("phone", (q) => q.eq("phone", cleanPhone)).first();
    if (byPhone) return { exists: true };
    
    return { exists: false };
  },
});

export const resolveLoginEmail = query({
  args: { identifier: v.string() },
  handler: async (ctx, { identifier }) => {
    const cleaned = identifier.trim();
    const cleanedDigits = cleaned.replace(/\D/g, "");
    const isPhone = /^\d{10}$/.test(cleanedDigits);
    if (isPhone) {
      const user = await ctx.db
        .query("users")
        .withIndex("phone", (q) => q.eq("phone", cleanedDigits))
        .first();
      return user ? user.email : null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", cleaned.toLowerCase()))
      .first();
    return user ? user.email : null;
  },
});

/**
 * Bootstrap the first admin user. 
 * This only works if no admin exists in the database.
 */
export const bootstrapAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const existingAdmin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (existingAdmin) {
      throw new ConvexError("An admin already exists. Use the admin panel to manage roles.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email.toLowerCase().trim()))
      .first();

    if (!user) {
      throw new ConvexError("User not found. Please sign up first.");
    }

    await ctx.db.patch(user._id, { role: "admin" });
    return { success: true, message: `${user.name} has been promoted to Admin.` };
  },
});
