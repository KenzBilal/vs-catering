
/**
 * Helper to update denormalized counts on a catering record.
 * Call this after any registration status change.
 */
export async function syncCateringCounters(ctx, cateringId) {
  const regs = await ctx.db
    .query("registrations")
    .withIndex("by_catering", (q) => q.eq("cateringId", cateringId))
    .collect();

  await ctx.db.patch(cateringId, {
    registeredCount: regs.filter(r => r.status === "registered").length,
    verifiedCount: regs.filter(r => r.verificationStatus === "verified").length,
  });
}
