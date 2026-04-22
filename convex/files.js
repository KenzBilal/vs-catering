import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserFromToken } from "./auth";

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getUserFromToken(ctx, token);
    if (!user) {
      throw new ConvexError("Unauthorized: Authentication required to generate upload URL.");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const getImageUrl = query({
  args: { storageId: v.any() }, 
  handler: async (ctx, { storageId }) => {
    if (!storageId || typeof storageId !== "string") return null;
    try {
      return await ctx.storage.getUrl(storageId);
    } catch (e) {
      return null;
    }
  },
});

export const deleteFile = mutation({
  args: { storageId: v.id("_storage"), token: v.string() },
  handler: async (ctx, { storageId, token }) => {
    const user = await getUserFromToken(ctx, token);
    if (!user) throw new ConvexError("Unauthorized");

    // Admins and Sub-Admins can delete files
    if (user.role === "admin" || user.role === "sub_admin") {
      await ctx.storage.delete(storageId);
      return;
    }

    // Students can only delete their own profile photo
    if (user.photoStorageId === storageId) {
      await ctx.storage.delete(storageId);
      return;
    }

    // Or a photo attached to one of their registrations
    const reg = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("photoStorageId"), storageId))
      .first();

    if (reg) {
      await ctx.storage.delete(storageId);
      return;
    }

    throw new ConvexError("Unauthorized: You do not have permission to delete this file.");
  },
});
