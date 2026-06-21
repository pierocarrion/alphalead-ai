import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  _stripe = new Stripe(key, {
    apiVersion: "2025-08-27.basil",
  });
  return _stripe;
}

export const PRICE_IDS = {
  team: process.env.STRIPE_PRICE_TEAM ?? "",
  business: process.env.STRIPE_PRICE_BUSINESS ?? "",
};

export function getPriceId(plan: "team" | "business"): string {
  const id = PRICE_IDS[plan];
  if (!id) throw new Error(`Missing Stripe price ID for plan ${plan}`);
  return id;
}
