import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email,
          name: params.name,
          phone: params.phone,
          stayType: params.stayType,
          gender: params.gender,
          defaultDropPoint: params.defaultDropPoint,
          role: "student",
          emailVerified: false,
        };
      },
    }),
  ],
});

// Helper to get user ID and user doc
export async function getAuthUser(ctx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

// Retro-compatible helper so we don't break existing files passing "token" arg 
// (We will remove the token arg from client calls later)
export async function getUserFromToken(ctx, token) {
  return await getAuthUser(ctx);
}

export async function requireAdmin(ctx, token) {
  const user = await getAuthUser(ctx);
  if (!user || user.role !== "admin") {
    throw new ConvexError("Unauthorized: Admin access required.");
  }
  return user;
}

export async function requireSubAdmin(ctx, token) {
  const user = await getAuthUser(ctx);
  if (!user || (user.role !== "admin" && user.role !== "sub_admin")) {
    throw new ConvexError("Unauthorized: Sub-admin or admin access required.");
  }
  return user;
}

export async function checkPermission(ctx, token, permissionKey) {
  const user = await getAuthUser(ctx);
  if (!user) throw new ConvexError("Not authenticated.");
  
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

export async function getAllAdmins(ctx) {
  const admins = await ctx.db
    .query("users")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .collect();
  const subAdmins = await ctx.db
    .query("users")
    .withIndex("by_role", (q) => q.eq("role", "sub_admin"))
    .collect();
  return [...admins, ...subAdmins];
}
