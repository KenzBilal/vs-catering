import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserFromToken } from "./auth";

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await getUserFromToken(ctx, token); // Ensure user is authenticated
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
    // Ideally check if user is admin or owner of the file.
    // For now, allow any authenticated user to delete if they have the ID,
    // which is better than publicly open.
    await ctx.storage.delete(storageId);
  },
});
