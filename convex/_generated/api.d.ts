/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminSettings from "../adminSettings.js";
import type * as auth from "../auth.js";
import type * as caterings from "../caterings.js";
import type * as crons from "../crons.js";
import type * as dropPoints from "../dropPoints.js";
import type * as files from "../files.js";
import type * as maintenance from "../maintenance.js";
import type * as payments from "../payments.js";
import type * as registrations from "../registrations.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminSettings: typeof adminSettings;
  auth: typeof auth;
  caterings: typeof caterings;
  crons: typeof crons;
  dropPoints: typeof dropPoints;
  files: typeof files;
  maintenance: typeof maintenance;
  payments: typeof payments;
  registrations: typeof registrations;
  users: typeof users;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
