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

    // 2. Call internal mutation to complete login
    return await ctx.runMutation(internal.users.loginUserInternal, {
      email,
      rememberMe,
      firebaseVerified: isVerified,
    });
  },
});
