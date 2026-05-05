import { v, ConvexError } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
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

// Admin-only: get user stats efficiently without loading all docs into memory
export const getUserStats = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx) => {
    await checkPermission(ctx, null, "manage_users");
    const total = await ctx.db.query("users").withIndex("by_role").count();
    const admin = await ctx.db.query("users").withIndex("by_role", q => q.eq("role", "admin")).count();
    const sub_admin = await ctx.db.query("users").withIndex("by_role", q => q.eq("role", "sub_admin")).count();
    const student = await ctx.db.query("users").withIndex("by_role", q => q.eq("role", "student")).count();
    return { total, admin, sub_admin, student };
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

// Admin mutation to delete a user with cascade cleanup safely via background job
export const deleteUser = mutation({
  args: { userId: v.id("users"), token: v.optional(v.string()) },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);
    await ctx.scheduler.runAfter(0, internal.users.deleteUserCascade, { userId });
  },
});

export const deleteUserCascade = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Delete registrations (bounded 100)
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(100);

    const cateringIds = [...new Set(regs.map(r => r.cateringId))];
    const regIdSet = new Set(regs.map(r => r._id));
    for (const cateringId of cateringIds) {
      const groups = await ctx.db
        .query("paymentGroups")
        .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
        .collect();
      for (const group of groups) {
        if (group.headUserId === userId) continue; 
        const hasRef = group.memberRegIds.some(id => regIdSet.has(id));
        if (hasRef) {
          const newMembers = group.memberRegIds.filter(id => !regIdSet.has(id));
          if (newMembers.length < 2) {
            await ctx.db.delete(group._id);
          } else {
            await ctx.db.patch(group._id, { memberRegIds: newMembers });
          }
        }
      }
    }

    for (const r of regs) {
      await ctx.db.delete(r._id);
    }

    // Delete payments (bounded 100)
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(100);
    for (const p of payments) {
      await ctx.db.delete(p._id);
    }

    const groupsAsHead = await ctx.db
      .query("paymentGroups")
      .withIndex("by_head", (q) => q.eq("headUserId", userId))
      .take(100);
    for (const g of groupsAsHead) {
      await ctx.db.delete(g._id);
    }

    const moreRegs = await ctx.db.query("registrations").withIndex("by_user", q => q.eq("userId", userId)).first();
    const morePays = await ctx.db.query("payments").withIndex("by_user", q => q.eq("userId", userId)).first();
    const moreGroups = await ctx.db.query("paymentGroups").withIndex("by_head", q => q.eq("headUserId", userId)).first();
    
    if (moreRegs || morePays || moreGroups) {
      await ctx.scheduler.runAfter(0, internal.users.deleteUserCascade, { userId });
    } else {
      const u = await ctx.db.get(userId);
      if (u) await ctx.db.delete(userId);
    }
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
    });
  }
});

// Alias used by register flow — same as updateProfile
export const updatePreferences = mutation({
  args: {
    token: v.optional(v.string()),
    defaultDropPoint: v.optional(v.string()),
    stayType: v.optional(v.union(v.literal("hostel"), v.literal("day_scholar"))),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthUser(ctx);
    if (!caller) throw new ConvexError("Unauthorized");
    await ctx.db.patch(caller._id, {
      ...(args.defaultDropPoint !== undefined && { defaultDropPoint: args.defaultDropPoint }),
      ...(args.stayType !== undefined && { stayType: args.stayType }),
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

export const getUsersPaginated = query({
  args: { 
    paginationOpts: v.any(), 
    roleFilter: v.string(), 
    searchQuery: v.string(),
    token: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const caller = await checkPermission(ctx, args.token, "manage_users");
    
    let userQuery;
    if (args.roleFilter !== "All") {
      const roleStr = args.roleFilter.toLowerCase().replace("-", "_");
      userQuery = ctx.db.query("users").withIndex("by_role", q => q.eq("role", roleStr));
    } else {
      userQuery = ctx.db.query("users").withIndex("by_role");
    }

    if (caller.role === "sub_admin" && args.roleFilter !== "student") {
      // Sub-admins can only see students
      userQuery = ctx.db.query("users").withIndex("by_role", q => q.eq("role", "student"));
    }

    // Apply search filter
    if (args.searchQuery) {
      const q = args.searchQuery.toLowerCase();
      userQuery = userQuery.filter(c => c.or(
        c.eq(c.field("phone"), q),
        c.eq(c.field("email"), q)
      ));
      // Note: text search on name requires search index, but phone/email exact match or simple scan works for small paginated bounds.
      // Better approach for name: we'll pull the page and filter on client side.
    }

    return await userQuery.paginate(args.paginationOpts);
  },
});

export const searchStudents = query({
  args: { searchQuery: v.string(), token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token); // used by ManageSubAdmins
    const q = args.searchQuery.toLowerCase();
    
    // We fetch a batch of students and filter. Since we only want top 5 matches, a bounded query is fine.
    // For proper search, a Convex Search Index should be used, but this is a quick fix to avoid Full Table Scan.
    const allStudents = await ctx.db.query("users").withIndex("by_role", q => q.eq("role", "student")).collect();
    
    return allStudents.filter(u => 
      u.name.toLowerCase().includes(q) || u.phone.includes(q)
    ).slice(0, 5);
  }
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
      .withIndex("by_role", (q) => q.eq("role", "admin"))
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
