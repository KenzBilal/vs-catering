import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

const FIREBASE_PROJECT_ID = "vs-catering-b3438"; // Hardcoded or from env

/**
 * Action to verify a Firebase ID token.
 * This is more secure than trusting a flag from the client.
 */
export const verifyAndLogin = action({
  args: { 
    idToken: v.string(), 
    rememberMe: v.optional(v.boolean()),
  },
  handler: async (ctx, { idToken, rememberMe }) => {
    // 1. Verify token with Firebase REST API
    // (In a production app, we'd use a library, but fetch is fine for simple verification)
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.VITE_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    const data = await response.json();
    if (!response.ok || !data.users || data.users.length === 0) {
      throw new ConvexError("Invalid or expired authentication token.");
    }

    const firebaseUser = data.users[0];
    const email = firebaseUser.email.toLowerCase();
    const isVerified = firebaseUser.emailVerified;

    return await ctx.runMutation(internal.users.loginUserInternal, {
      email,
      rememberMe,
      firebaseVerified: isVerified,
    });
  },
});

export const verifyAndCreateUser = action({
  args: { 
    idToken: v.string(), 
    userData: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      stayType: v.union(v.literal("hostel"), v.literal("day_scholar")),
      gender: v.union(v.literal("male"), v.literal("female")),
      defaultDropPoint: v.string(),
    })
  },
  handler: async (ctx, { idToken, userData }) => {
    // 1. Verify token
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.VITE_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    const data = await response.json();
    if (!response.ok || !data.users || data.users.length === 0) {
      throw new ConvexError("Invalid authentication token.");
    }

    const firebaseUser = data.users[0];
    if (firebaseUser.email.toLowerCase() !== userData.email.toLowerCase()) {
      throw new ConvexError("Email mismatch: Authentication token does not match provided email.");
    }

    // 2. Call internal mutation to create user
    return await ctx.runMutation(internal.users.createUserInternal, userData);
  },
});
