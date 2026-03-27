export const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://rightful-eel-502.convex.cloud";

export async function convexQuery<T = unknown>(path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
    cache: "no-store",
  });
  const data = await res.json();
  return data.value as T;
}

export async function convexMutation<T = unknown>(path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.34.0" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  const data = await res.json();
  return data.value as T;
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
