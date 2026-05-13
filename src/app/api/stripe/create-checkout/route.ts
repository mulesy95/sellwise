import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

const PRICE_IDS: Record<string, Record<string, string | undefined>> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER,
    annual:  process.env.STRIPE_PRICE_STARTER_ANNUAL,
  },
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH,
    annual:  process.env.STRIPE_PRICE_GROWTH_ANNUAL,
  },
  studio: {
    monthly: process.env.STRIPE_PRICE_STUDIO,
    annual:  process.env.STRIPE_PRICE_STUDIO_ANNUAL,
  },
};

const requestSchema = z.object({
  plan: z.enum(["starter", "growth", "studio"]),
  billing: z.enum(["monthly", "annual"]).default("monthly"),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { plan, billing } = parsed.data;
  const priceId = PRICE_IDS[plan]?.[billing];

  if (!priceId) {
    return NextResponse.json(
      { error: `No price configured for ${plan} ${billing}. Add the env var and redeploy.` },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
