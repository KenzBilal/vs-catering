import { mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./auth";
import { internal } from "./_generated/api";

export const cleanupAdminSettings = mutation({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const settings = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    if (settings) {
      const { payoutSettings, ...rest } = settings;
      await ctx.db.replace(settings._id, rest);
    }
    return "ok";
  },
});

export const migrateLegacyPhotos = action({
  args: {},
  handler: async (ctx) => {
    const regs = await ctx.runQuery(internal.migrations.getLegacyRegistrations);
    
    for (const reg of regs) {
      if (!reg.photoUrl) continue;
      
      try {
        console.log(`Migrating photo for registration ${reg._id}`);
        const response = await fetch(reg.photoUrl);
        if (!response.ok) {
           console.error(`Failed to fetch photo for ${reg._id}: ${response.statusText}`);
           continue;
        }
        
        const blob = await response.blob();
        
        const uploadUrl = await ctx.storage.generateUploadUrl();
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": response.headers.get("Content-Type") || "image/jpeg" },
          body: blob
        });
        
        if (!uploadResponse.ok) {
           console.error(`Failed to upload photo for ${reg._id}`);
           continue;
        }
        
        const { storageId } = await uploadResponse.json();
        
        await ctx.runMutation(internal.migrations.updateRegistrationPhoto, {
          registrationId: reg._id,
          photoStorageId: storageId
        });
        
      } catch (err) {
        console.error(`Error migrating photo for ${reg._id}:`, err);
      }
    }
    
    return { success: true, count: regs.length };
  }
});

export const getLegacyRegistrations = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("registrations")
      .filter(q => q.neq(q.field("photoUrl"), undefined))
      .collect();
  }
});

export const updateRegistrationPhoto = internalMutation({
  args: { registrationId: v.id("registrations"), photoStorageId: v.id("_storage") },
  handler: async (ctx, { registrationId, photoStorageId }) => {
    await ctx.db.patch(registrationId, { photoStorageId, photoUrl: undefined });
  }
});
