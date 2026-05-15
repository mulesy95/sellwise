import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { upgradeSuccessEmail } from "@/lib/emails/upgrade-success";
import { subscriptionCancelledEmail } from "@/lib/emails/subscription-cancelled";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

// Price ID → plan name lookup built from env vars
function priceIdToPlan(priceId: string): string | null {
  const map: Record<string, string> = {};
  if (process.env.STRIPE_PRICE_STARTER)        map[process.env.STRIPE_PRICE_STARTER]        = "starter";
  if (process.env.STRIPE_PRICE_STARTER_ANNUAL) map[process.env.STRIPE_PRICE_STARTER_ANNUAL] = "starter";
  if (process.env.STRIPE_PRICE_GROWTH)         map[process.env.STRIPE_PRICE_GROWTH]         = "growth";
  if (process.env.STRIPE_PRICE_GROWTH_ANNUAL)  map[process.env.STRIPE_PRICE_GROWTH_ANNUAL]  = "growth";
  if (process.env.STRIPE_PRICE_STUDIO)         map[process.env.STRIPE_PRICE_STUDIO]         = "studio";
  if (process.env.STRIPE_PRICE_STUDIO_ANNUAL)  map[process.env.STRIPE_PRICE_STUDIO_ANNUAL]  = "studio";
  return map[priceId] ?? null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan;

      if (!userId || !plan) break;

      await supabase
        .from("profiles")
        .update({
          plan,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        })
        .eq("id", userId);

      // Send upgrade confirmation email
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, marketing_opted_out")
          .eq("id", userId)
          .single();
        if (profile && !profile.marketing_opted_out) {
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
          if (authUser?.email) {
            const firstName = (profile.full_name as string | null)?.split(" ")[0] ?? null;
            const { subject, html } = upgradeSuccessEmail(firstName, authUser.email, plan);
            void sendEmail({ to: authUser.email, subject, html });
          }
        }
      } catch (e) {
        console.error("[upgrade email]", e);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const plan = priceId ? priceIdToPlan(priceId) : null;

      if (!plan) break;

      await supabase
        .from("profiles")
        .update({ plan, stripe_subscription_id: sub.id })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;

      const { data: profile } = await supabase
        .from("profiles")
        .update({ plan: "free", stripe_subscription_id: null })
        .eq("stripe_customer_id", sub.customer as string)
        .select("id, full_name, marketing_opted_out")
        .single();

      // Send cancellation email
      if (profile && !profile.marketing_opted_out) {
        try {
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.id);
          if (authUser?.email) {
            const firstName = (profile.full_name as string | null)?.split(" ")[0] ?? null;
            const { subject, html } = subscriptionCancelledEmail(firstName, authUser.email);
            void sendEmail({ to: authUser.email, subject, html });
          }
        } catch (e) {
          console.error("[cancellation email]", e);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
