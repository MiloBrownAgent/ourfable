export type PlanType = "standard" | "plus";
export type BillingPeriod = "monthly" | "annual";

export const FOUNDING_PLAN_PRICES: Record<PlanType, Record<BillingPeriod, number>> = {
  standard: { monthly: 12, annual: 99 },
  plus: { monthly: 19, annual: 149 },
};

export const REGULAR_PLAN_PRICES: Record<PlanType, Record<BillingPeriod, number>> = {
  standard: { monthly: 16, annual: 149 },
  plus: { monthly: 25, annual: 199 },
};

export const FOUNDING_CHILD_ADDON_PRICES: Record<BillingPeriod, number> = {
  monthly: 7,
  annual: 59,
};

export const REGULAR_CHILD_ADDON_PRICES: Record<BillingPeriod, number> = {
  monthly: 9,
  annual: 79,
};

export const PLUS_INCLUDED_ADDITIONAL_CHILDREN = 1;

export function getIncludedAdditionalChildren(planType: PlanType): number {
  return planType === "plus" ? PLUS_INCLUDED_ADDITIONAL_CHILDREN : 0;
}
