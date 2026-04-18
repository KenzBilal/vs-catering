import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, getUserFromToken } from "./auth";

import { sanitizeString, validatePhone, validateRegistrationNumber, validateEmail } from "./utils";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5;

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeToken() {
  // 128-bit hex token — cryptographically secure via Web Crypto API
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── createUser ──────────────────────────────────────────────────────────────

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    stayType: v.union(v.literal("hostel"), v.literal("day_scholar")),
    gender: v.union(v.literal("male"), v.literal("female")),
    defaultDropPoint: v.string(),
    registrationNumber: v.optional(v.string()),
    rememberMe: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    if (!validateEmail(email)) throw new ConvexError("Enter a valid email address.");

    const phone = args.phone.replace(/\D/g, "").slice(-10);
    if (!validatePhone(phone)) throw new ConvexError("Enter a valid 10-digit mobile number.");

    if (args.registrationNumber && !validateRegistrationNumber(args.registrationNumber)) {
      throw new ConvexError("Enter a valid 8-digit registration number.");
    }

    const name = sanitizeString(args.name).slice(0, 50);
    if (name.length < 2) throw new ConvexError("Name is too short.");

    const existingEmail = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).first();
    if (existingEmail) throw new ConvexError("This email is already registered.");

    const existingPhone = await ctx.db.query("users").withIndex("by_phone", (q) => q.eq("phone", phone)).first();
    if (existingPhone) throw new ConvexError("This phone number is already registered.");

    const userId = await ctx.db.insert("users", {
      name,
      email,
      phone,
      stayType: args.stayType,
      gender: args.gender,
      defaultDropPoint: sanitizeString(args.defaultDropPoint).slice(0, 100),
      registrationNumber: args.registrationNumber,
      role: "student",
      createdAt: Date.now(),
    });

    const user = await ctx.db.get(userId);
    const token = makeToken();
    // #8: Flexible session expiry
    const duration = args.rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24;
    const expiresAt = Date.now() + duration;
    await ctx.db.insert("sessions", { userId, token, expiresAt });
    return { ...user, token };
  },
});

// ─── loginUser ───────────────────────────────────────────────────────────────

export const loginUser = mutation({
  args: { email: v.string(), rememberMe: v.optional(v.boolean()) },
  handler: async (ctx, { email, rememberMe }) => {
    const cleanEmail = email.toLowerCase().trim();
    if (!validateEmail(cleanEmail)) throw new ConvexError("Enter a valid email address.");

    const now = Date.now();

    // Rate limiting
    const attemptRecord = await ctx.db
      .query("loginAttempts")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .first();

    if (attemptRecord) {
      const timeSinceStart = now - attemptRecord.windowStart;
      const withinWindow = timeSinceStart >= 0 && timeSinceStart < RATE_LIMIT_WINDOW_MS;

      if (withinWindow && attemptRecord.attempts >= RATE_LIMIT_MAX) {
        const waitMins = Math.ceil((RATE_LIMIT_WINDOW_MS - timeSinceStart) / 60000);
        throw new ConvexError(`Too many login attempts. Try again in ${waitMins} minute${waitMins !== 1 ? "s" : ""}.`);
      }
      if (!withinWindow) {
        await ctx.db.patch(attemptRecord._id, { attempts: 0, windowStart: now });
      }
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .first();

    if (!user) {
      // Record failed attempt
      if (attemptRecord) {
        const timeSinceStart = now - attemptRecord.windowStart;
        const withinWindow = timeSinceStart >= 0 && timeSinceStart < RATE_LIMIT_WINDOW_MS;
        await ctx.db.patch(attemptRecord._id, {
          attempts: withinWindow ? attemptRecord.attempts + 1 : 1,
          windowStart: withinWindow ? attemptRecord.windowStart : now,
        });
      } else {
        await ctx.db.insert("loginAttempts", { email: cleanEmail, attempts: 1, windowStart: now });
      }
      return null;
    }

    // Successful login — reset rate limiter, clean up stale sessions
    if (attemptRecord) {
      await ctx.db.patch(attemptRecord._id, { attempts: 0, windowStart: now });
    }

    // #25: Delete old sessions for this user to prevent session pile-up
    const oldSessions = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();
    for (const s of oldSessions) {
      await ctx.db.delete(s._id);
    }

    const token = makeToken();
    // #8: Flexible session expiry
    const duration = rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24;
    const expiresAt = Date.now() + duration;
    await ctx.db.insert("sessions", { userId: user._id, token, expiresAt });
    return { ...user, token };
  },
});

// ─── logoutUser ──────────────────────────────────────────────────────────────

export const logoutUser = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (session) await ctx.db.delete(session._id);
  },
});

// #13: Admin mutation to delete a user with cascade session cleanup
export const deleteUser = mutation({
  args: { userId: v.id("users"), token: v.string() },
  handler: async (ctx, { userId, token }) => {
    await requireAdmin(ctx, token);

    // Cascade delete sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const s of sessions) {
      await ctx.db.delete(s._id);
    }

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

    // Delete login attempts
    const user = await ctx.db.get(userId);
    if (user) {
      const attempts = await ctx.db
        .query("loginAttempts")
        .withIndex("by_email", (q) => q.eq("email", user.email))
        .collect();
      for (const a of attempts) {
        await ctx.db.delete(a._id);
      }
    }

    await ctx.db.delete(userId);
  },
});

// ─── getUser ─────────────────────────────────────────────────────────────────

export const getUser = query({
  args: { userId: v.id("users"), token: v.string() },
  handler: async (ctx, { userId, token }) => {
    const caller = await getUserFromToken(ctx, token);
    if (!caller) throw new ConvexError("Unauthorized");

    // Only allow self or admin/sub-admin
    const isAdmin = caller.role === "admin" || caller.role === "sub_admin";
    if (caller._id !== userId && !isAdmin) {
      throw new ConvexError("Unauthorized: You can only view your own profile.");
    }

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Filter sensitive fields for sub-admins if they are viewing others
    if (caller.role === "sub_admin" && caller._id !== userId) {
      return {
        _id: user._id,
        _creationTime: user._creationTime,
        name: user.name,
        role: user.role,
        gender: user.gender,
        photoStorageId: user.photoStorageId,
      };
    }

    return user;
  },
});

// ─── updatePreferences — derives userId from token (fixes #2) ────────────────

export const updatePreferences = mutation({
  args: {
    token: v.string(),
    defaultDropPoint: v.string(),
    stayType: v.union(v.literal("hostel"), v.literal("day_scholar")),
    photoStorageId: v.optional(v.id("_storage")),
    registrationNumber: v.optional(v.string()),
  },
  handler: async (ctx, { token, defaultDropPoint, stayType, photoStorageId, registrationNumber }) => {
    // Derive userId server-side — never trust client
    const caller = await getUserFromToken(ctx, token);
    if (!caller) throw new ConvexError("Not authenticated.");

    // Helper for role checks
    const isAdmin = caller.role === "admin" || caller.role === "sub_admin";

    if (registrationNumber && !validateRegistrationNumber(registrationNumber)) {
      throw new ConvexError("Enter a valid 8-digit registration number.");
    }

    await ctx.db.patch(caller._id, {
      defaultDropPoint: sanitizeString(defaultDropPoint).slice(0, 100),
      stayType,
      ...(photoStorageId ? { photoStorageId } : {}),
      registrationNumber,
    });
  },
});

// ─── setUserRole ─────────────────────────────────────────────────────────────

export const setUserRole = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("sub_admin"), v.literal("student")),
  },
  handler: async (ctx, { token, userId, role }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(userId, { role });
  },
});

// ─── getAllStudents — authenticated + students only (fixes #1 #22) ─────────────

export const getAllStudents = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const caller = await getUserFromToken(ctx, token);
    if (!caller || (caller.role !== "admin" && caller.role !== "sub_admin")) {
      throw new ConvexError("Unauthorized.");
    }
    
    const users = await ctx.db.query("users").collect();
    // #5: Sub-admins only see students to protect admin PII
    if (caller.role === "sub_admin") {
      return users.filter((u) => u.role === "student");
    }
    return users;
  },
});

// ─── resolveLoginEmail — resolves phone or email identifier for Firebase login ─
// Uses indexed lookup for performance (#13) and returns only the email string,
// not the full user object, to minimise data exposure (#7)

// #9: Pre-check for existing account to avoid orphaned Firebase accounts
export const checkUserExists = query({
  args: { email: v.string(), phone: v.string() },
  handler: async (ctx, { email, phone }) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    
    const byEmail = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", cleanEmail)).first();
    const byPhone = await ctx.db.query("users").withIndex("by_phone", (q) => q.eq("phone", cleanPhone)).first();
    
    return { exists: !!(byEmail || byPhone) };
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
        .withIndex("by_phone", (q) => q.eq("phone", cleanedDigits))
        .first();
      return user ? user.email : null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", cleaned.toLowerCase()))
      .first();
    return user ? user.email : null;
  },
});



export const debugListUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  }
});
