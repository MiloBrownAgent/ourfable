export const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://rightful-eel-502.convex.cloud";

import { internalConvexQuery, internalConvexMutation } from "./convex-internal";

/**
 * Server-side Convex query — routes through the authenticated internal HTTP gateway.
 * Path format: "module:functionName" (e.g. "ourfable:getFamily")
 */
export async function convexQuery<T = unknown>(path: string, args: Record<string, unknown>): Promise<T> {
  return internalConvexQuery<T>(path, args);
}

/**
 * Server-side Convex mutation — routes through the authenticated internal HTTP gateway.
 * Path format: "module:functionName" (e.g. "ourfable:createFamily")
 */
export async function convexMutation<T = unknown>(path: string, args: Record<string, unknown>): Promise<T> {
  return internalConvexMutation<T>(path, args);
}

export function calcAge(dob: string, asOf?: string) {
  const born = new Date(dob + "T00:00:00");
  const target = asOf ? new Date(asOf + "T00:00:00") : new Date();
  let months = (target.getFullYear() - born.getFullYear()) * 12 + (target.getMonth() - born.getMonth());
  const dayBorn = born.getDate();
  let dayTarget = target.getDate();
  if (dayTarget < dayBorn) {
    months--;
    const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
    dayTarget += prevMonth.getDate();
  }
  const days = dayTarget - dayBorn;
  const diffMs = target.getTime() - born.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  return { months, days, totalDays, weeks };
}

export function formatAgeShort(months: number, days: number): string {
  if (months === 0) return `${days}d`;
  return `${months}m ${days}d`;
}

export function formatAgeLong(months: number, days: number): string {
  if (months === 0) return `${days} day${days !== 1 ? "s" : ""} old`;
  return `${months} month${months !== 1 ? "s" : ""}, ${days} day${days !== 1 ? "s" : ""} old`;
}
