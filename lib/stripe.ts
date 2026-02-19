// lib/stripe.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

export const PRICES = {
  digital: Number(process.env.STRIPE_PRICE_DIGITAL) || 1499,     // $14.99
  hardcover: Number(process.env.STRIPE_PRICE_HARDCOVER) || 3499,  // $34.99
} as const;
