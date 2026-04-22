import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

// Helper to get user from token
export async function getUserFromToken(ctx, token) {
  if (!token) return null;
  
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();
    
  if (!session) return null;
  
  // Check if expired
  if (session.expiresAt < Date.now()) {
    return null;
  }
  
  return await ctx.db.get(session.userId);
}

// Helper to enforce admin role
export async function requireAdmin(ctx, token) {
  const user = await getUserFromToken(ctx, token);
  if (!user || user.role !== "admin") {
    throw new ConvexError("Unauthorized: Admin access required.");
  }
  return user;
}

// Helper to enforce sub-admin or admin role
export async function requireSubAdmin(ctx, token) {
  const user = await getUserFromToken(ctx, token);
  if (!user || (user.role !== "admin" && user.role !== "sub_admin")) {
    throw new ConvexError("Unauthorized: Sub-admin or admin access required.");
  }
  return user;
}

// Helper to check granular permissions for sub-admins
export async function checkPermission(ctx, token, permissionKey) {
  const user = await getUserFromToken(ctx, token);
  if (!user) throw new ConvexError("Not authenticated.");
  
  // Admin has all permissions
  if (user.role === "admin") return user;
  
  if (user.role === "sub_admin") {
    const settings = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    
    if (!settings) throw new ConvexError("System settings not initialized. Access denied.");
    
    const perm = settings.subAdminPermissions.find(p => p.permission === permissionKey);
    if (perm && perm.enabled) return user;
    
    throw new ConvexError(`Unauthorized: You do not have permission to ${permissionKey.replace(/_/g, " ")}.`);
  }
  
  throw new ConvexError("Unauthorized access.");
}

// Helper to get all admins and sub-admins for notification targeting
export async function getAllAdmins(ctx) {
  const admins = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("role"), "admin"))
    .collect();
  const subAdmins = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("role"), "sub_admin"))
    .collect();
  return [...admins, ...subAdmins];
}


export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await getUserFromToken(ctx, token);
  },
});
