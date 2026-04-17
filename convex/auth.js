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

// Query to validate current session from frontend
export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getUserFromToken(ctx, token);
    return user;
  },
});
