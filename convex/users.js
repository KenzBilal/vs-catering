import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./auth";

// Sanitize: strip HTML tags, trim whitespace, enforce max length
function sanitize(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim().slice(0, maxLen);
}

// Validate Indian mobile number: 10 digits, starts with 6-9
function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5;

export const createUser = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    stayType: v.union(v.literal("hostel"), v.literal("day_scholar")),
    gender: v.union(v.literal("male"), v.literal("female")),
    defaultDropPoint: v.string(),
  },
  handler: async (ctx, args) => {
    const phone = args.phone.trim();
    if (!isValidPhone(phone)) {
      throw new Error("Enter a valid 10-digit Indian mobile number (starting with 6–9).");
    }

    const name = sanitize(args.name, 100);
    if (name.length < 2) throw new Error("Name is too short.");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
    if (existing) throw new Error("This phone number is already registered.");

    return await ctx.db.insert("users", {
      name,
      phone,
      stayType: args.stayType,
      gender: args.gender,
      defaultDropPoint: sanitize(args.defaultDropPoint, 100),
      role: "student",
      createdAt: Date.now(),
    });
  },
});

export const loginUser = mutation({
  args: { phone: v.string(), name: v.string() },
  handler: async (ctx, { phone, name }) => {
    const cleanPhone = phone.trim();

    // Enforce valid format before even touching DB
    if (!isValidPhone(cleanPhone)) {
      throw new Error("Enter a valid 10-digit Indian mobile number (starting with 6–9).");
    }

    // Rate limiting
    const now = Date.now();
    const attemptRecord = await ctx.db
      .query("loginAttempts")
      .withIndex("by_phone", (q) => q.eq("phone", cleanPhone))
      .first();

    if (attemptRecord) {
      const withinWindow = now - attemptRecord.windowStart < RATE_LIMIT_WINDOW_MS;
      if (withinWindow && attemptRecord.attempts >= RATE_LIMIT_MAX) {
        const waitMins = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - attemptRecord.windowStart)) / 60000);
        throw new Error(`Too many login attempts. Try again in ${waitMins} minute${waitMins !== 1 ? "s" : ""}.`);
      }
      // Reset window if expired
      if (!withinWindow) {
        await ctx.db.patch(attemptRecord._id, { attempts: 0, windowStart: now });
      }
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", cleanPhone))
      .first();

    if (!user || user.name.toLowerCase() !== name.toLowerCase().trim()) {
      // Record failed attempt
      if (attemptRecord) {
        const withinWindow = now - attemptRecord.windowStart < RATE_LIMIT_WINDOW_MS;
        await ctx.db.patch(attemptRecord._id, {
          attempts: withinWindow ? attemptRecord.attempts + 1 : 1,
          windowStart: withinWindow ? attemptRecord.windowStart : now,
        });
      } else {
        await ctx.db.insert("loginAttempts", { phone: cleanPhone, attempts: 1, windowStart: now });
      }
      return null;
    }

    // Successful login — reset rate limit counter
    if (attemptRecord) {
      await ctx.db.patch(attemptRecord._id, { attempts: 0, windowStart: now });
    }

    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
    await ctx.db.insert("sessions", { userId: user._id, token, expiresAt });

    return { ...user, token };
  },
});

export const logoutUser = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

export const updatePreferences = mutation({
  args: {
    userId: v.id("users"),
    defaultDropPoint: v.string(),
    stayType: v.union(v.literal("hostel"), v.literal("day_scholar")),
    photoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { userId, defaultDropPoint, stayType, photoStorageId }) => {
    await ctx.db.patch(userId, {
      defaultDropPoint: sanitize(defaultDropPoint, 100),
      stayType,
      ...(photoStorageId ? { photoStorageId } : {}),
    });
  },
});

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

export const getAllStudents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
