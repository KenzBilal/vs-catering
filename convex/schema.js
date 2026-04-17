import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    phone: v.string(),
    stayType: v.union(v.literal("hostel"), v.literal("day_scholar")),
    gender: v.union(v.literal("male"), v.literal("female")),
    defaultDropPoint: v.string(),
    role: v.union(v.literal("admin"), v.literal("sub_admin"), v.literal("student")),
    createdAt: v.number(),
  })
    .index("by_phone", ["phone"]),

  dropPoints: defineTable({
    name: v.string(),
    isActive: v.boolean(),
  }),

  caterings: defineTable({
    title: v.string(),
    place: v.string(),
    timeOfDay: v.union(v.literal("evening"), v.literal("night")),
    specificTime: v.string(),
    dates: v.array(v.string()),          // ["2024-04-19"] or ["2024-04-19","2024-04-20"]
    isTwoDay: v.boolean(),
    sameSlotsForBothDays: v.boolean(),
    joinRule: v.union(v.literal("any_day"), v.literal("both_days")),
    photoRequired: v.boolean(),
    dressCodeNotes: v.string(),
    slots: v.array(v.object({
      day: v.number(),                   // 0 = day1, 1 = day2
      role: v.string(),                  // "service_boy","service_girl","captain_male"
      limit: v.number(),
      pay: v.number(),
    })),
    status: v.union(
      v.literal("upcoming"),
      v.literal("today"),
      v.literal("tomorrow"),
      v.literal("ended")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }),

  registrations: defineTable({
    userId: v.id("users"),
    cateringId: v.id("caterings"),
    days: v.array(v.number()),           // [0] or [0,1]
    role: v.string(),
    dropPoint: v.string(),
    photoUrl: v.optional(v.string()),
    queuePosition: v.number(),
    isConfirmed: v.boolean(),            // within slot limit
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
    .index("by_status", ["status"]),
});
