/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as ourfable from "../ourfable.js";
import type * as ourfableAI from "../ourfableAI.js";
import type * as ourfableDelivery from "../ourfableDelivery.js";
import type * as ourfableMilestones from "../ourfableMilestones.js";
import type * as ourfableMonthly from "../ourfableMonthly.js";
import type * as ourfablePrompts from "../ourfablePrompts.js";
import type * as questionQueue from "../questionQueue.js";
import type * as questions from "../questions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  ourfable: typeof ourfable;
  ourfableAI: typeof ourfableAI;
  ourfableDelivery: typeof ourfableDelivery;
  ourfableMilestones: typeof ourfableMilestones;
  ourfableMonthly: typeof ourfableMonthly;
  ourfablePrompts: typeof ourfablePrompts;
  questionQueue: typeof questionQueue;
  questions: typeof questions;
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
