import { NextResponse } from "next/server";
import { getStripe } from "@/server/lib/stripe";
import { prisma } from "@/server/lib/prisma";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      const plan = (session.metadata?.plan as "team" | "business") ?? "team";
      if (workspaceId && session.subscription) {
        await prisma.workspaceSubscription.upsert({
          where: { workspaceId },
          create: {
            workspaceId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            plan,
            status: "active",
          },
          update: {
            stripeSubscriptionId: session.subscription as string,
            plan,
            status: "active",
          },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // Stripe Invoice types omit subscription in some versions; cast safely.
      const subscriptionId = (invoice as unknown as { subscription?: string }).subscription;
      if (subscriptionId) {
        await prisma.workspaceSubscription.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: "past_due" },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.workspaceSubscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: "cancelled", plan: "free" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
