import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getImageUrl = query({
  args: { storageId: v.any() }, // Allow null/undefined to avoid crash, handle in handler
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
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await ctx.storage.delete(storageId);
  },
});
