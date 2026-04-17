import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    phone: v.string(),
    stayType: v.union(v.literal("hostel"), v.literal("day_scholar")),
    gender: v.union(v.literal("male"), v.literal("female")),
    defaultDropPoint: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
    role: v.union(v.literal("admin"), v.literal("sub_admin"), v.literal("student")),
    createdAt: v.number(),
  })
    .index("by_phone", ["phone"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  // Rate limiting for login attempts
  loginAttempts: defineTable({
    phone: v.string(),
    attempts: v.number(),
    windowStart: v.number(), // timestamp of first attempt in current window
  }).index("by_phone", ["phone"]),

  dropPoints: defineTable({
    name: v.string(),
    isActive: v.boolean(),
  }),

  caterings: defineTable({
    title: v.string(),
    place: v.string(),
    timeOfDay: v.union(v.literal("day"), v.literal("night")),
    specificTime: v.string(),
    dates: v.array(v.string()),
    isTwoDay: v.boolean(),
    sameSlotsForBothDays: v.boolean(),
    joinRule: v.union(v.literal("any_day"), v.literal("both_days")),
    photoRequired: v.boolean(),
    dressCodeNotes: v.string(),
    slots: v.array(v.object({
      day: v.number(),
      role: v.string(),
      limit: v.number(),
      pay: v.number(),
    })),
    status: v.union(
      v.literal("upcoming"),
      v.literal("today"),
      v.literal("tomorrow"),
      v.literal("ended"),
      v.literal("cancelled"),
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_created", ["createdAt"]),

  registrations: defineTable({
    userId: v.id("users"),
    cateringId: v.id("caterings"),
    days: v.array(v.number()),
    role: v.string(),
    dropPoint: v.string(),
    photoUrl: v.optional(v.string()), // Legacy
    photoStorageId: v.optional(v.id("_storage")),
    queuePosition: v.number(),
    isConfirmed: v.boolean(),
    status: v.union(
      v.literal("registered"),
      v.literal("attended"),
      v.literal("rejected"),
      v.literal("absent")
    ),
    rejectionReason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_catering", ["cateringId"])
    .index("by_user_catering", ["userId", "cateringId"]),

  payments: defineTable({
    userId: v.id("users"),
    cateringId: v.id("caterings"),
    registrationId: v.id("registrations"),
    day: v.number(),
    role: v.string(),
    amount: v.number(),
    method: v.union(v.literal("cash"), v.literal("upi")),
    status: v.union(v.literal("pending"), v.literal("cleared")),
    clearedBy: v.optional(v.id("users")),
    clearedAt: v.optional(v.number()),
    upiRef: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_catering", ["cateringId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),
});
