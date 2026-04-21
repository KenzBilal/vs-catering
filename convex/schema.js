import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    stayType: v.union(v.literal("hostel"), v.literal("day_scholar")),
    gender: v.union(v.literal("male"), v.literal("female")),
    defaultDropPoint: v.string(),
    photoStorageId: v.optional(v.union(v.id("_storage"), v.null())),

    registrationNumber: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("sub_admin"), v.literal("student")),
    lastReadNotificationsAt: v.optional(v.number()),
    adminPreferences: v.optional(v.object({
      showAnalytics: v.boolean(),
      showPendingPayments: v.boolean(),
      showActiveEvents: v.boolean(),
    })),
    createdAt: v.number(),
  })

    .index("by_email", ["email"])
    .index("by_phone", ["phone"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // Rate limiting for login attempts
  loginAttempts: defineTable({
    email: v.string(),
    attempts: v.number(),
    windowStart: v.number(), // timestamp of first attempt in current window
  }).index("by_email", ["email"]),

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
    payoutDate: v.optional(v.string()),
    payoutNote: v.optional(v.string()),
    limitSlots: v.optional(v.boolean()),
    verificationStatus: v.optional(v.union(
      v.literal("not_required"),
      v.literal("required"),
      v.literal("active"),
      v.literal("completed")
    )),
    verificationDeadline: v.optional(v.number()),
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
    verificationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("withdrawn")
    )),
    rejectionReason: v.optional(v.string()),
    createdAt: v.number(),
  })

    .index("by_user", ["userId"])
    .index("by_catering", ["cateringId"])
    .index("by_user_catering", ["userId", "cateringId"])
    .index("by_catering_role", ["cateringId", "role"]),

  payments: defineTable({
    userId: v.id("users"),
    cateringId: v.id("caterings"),
    registrationId: v.id("registrations"),
    day: v.number(),
    role: v.string(),
    amount: v.number(),
    method: v.union(v.literal("cash"), v.literal("upi")),
    status: v.union(v.literal("pending"), v.literal("cleared")),
    groupId: v.optional(v.id("paymentGroups")),
    clearedBy: v.optional(v.id("users")),
    clearedAt: v.optional(v.number()),
    upiRef: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_catering", ["cateringId"])
    .index("by_registration", ["registrationId"])
    .index("by_status", ["status"])
    .index("by_group", ["groupId"])
    .index("by_created", ["createdAt"]),

  paymentGroups: defineTable({
    cateringId: v.id("caterings"),
    headUserId: v.id("users"),
    memberRegIds: v.array(v.id("registrations")),
    totalAmount: v.number(),
    status: v.union(v.literal("pending"), v.literal("cleared")),
    clearedAt: v.optional(v.number()),
    clearedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_catering", ["cateringId"])
    .index("by_head", ["headUserId"]),

  adminSettings: defineTable({
    key: v.string(), // singleton "global"
    subAdminPermissions: v.array(v.object({
      permission: v.string(),
      enabled: v.boolean(),
      label: v.optional(v.string()),
      description: v.optional(v.string()),
      category: v.optional(v.string()),
    })),
    createdAt: v.number(),
  }).index("by_key", ["key"]),

  notifications: defineTable({
    type: v.union(
      v.literal("catering"),      // New, Cancelled, Updated
      v.literal("payment"),       // Pending, Cleared, Payout
      v.literal("role"),         // Role changes
      v.literal("system")       // General alerts
    ),
    category: v.string(),         // "global" | "individual"
    title: v.string(),
    message: v.string(),
    
    // For individual notifications
    targetUserId: v.optional(v.id("users")),
    
    // For catering-related
    cateringId: v.optional(v.id("caterings")),
    cateringTitle: v.optional(v.string()),
    cateringDate: v.optional(v.string()),
    
    // For payment-related
    paymentId: v.optional(v.id("payments")),
    amount: v.optional(v.number()),
    payoutDate: v.optional(v.string()),
    
    // For role-related
    targetUserName: v.optional(v.string()),
    
    isRead: v.boolean(),
    createdAt: v.number(),
  })
  .index("by_targetUser", ["targetUserId"])
  .index("by_created", ["createdAt"])
  .index("by_category", ["category"])
  .index("by_type", ["type"]),

  siteSettings: defineTable({
    key: v.string(), // singleton "global"
    siteName: v.string(),
    siteLogo: v.optional(v.union(v.id("_storage"), v.null())),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

});


