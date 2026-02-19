// lib/stripe.ts
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

/** @deprecated Use getStripe() instead — kept for backwards compat */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getStripe() as any)[prop];
  },
});

export const PRICES = {
  digital: Number(process.env.STRIPE_PRICE_DIGITAL) || 1499,     // $14.99
  hardcover: Number(process.env.STRIPE_PRICE_HARDCOVER) || 3499,  // $34.99
} as const;
