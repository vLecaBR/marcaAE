import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "mock_key_for_build", {
  apiVersion: "2025-02-24.acacia" as any,
  appInfo: {
    name: "MarcaAí",
    version: "0.1.0",
  },
})

export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || "mock_price"
