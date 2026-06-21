import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/lib/prisma";
import { getStripe, getPriceId } from "@/server/lib/stripe";
import { jsonError, parseRequestBody, toFriendlyMessage } from "@/server/lib/apiErrors";
import { requireUser } from "@/server/lib/auth";

const bodySchema = z.object({
  plan: z.enum(["team", "business"]).optional(),
  returnUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const user = auth.user;

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { memberships: { include: { workspace: true } } },
    });
    if (!fullUser) {
      return NextResponse.json(
        { error: "We couldn't find your account. Please sign in again." },
        { status: 404 }
      );
    }

    const membership = fullUser.memberships[0];
    if (!membership) {
      return NextResponse.json(
        { error: "You need a workspace before upgrading. Please set one up first." },
        { status: 400 }
      );
    }

    const parsed = bodySchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: toFriendlyMessage(parsed.error) },
        { status: 400 }
      );
    }

    const plan = parsed.data.plan === "business" ? "business" : "team";
    const returnUrl = parsed.data.returnUrl ?? `${process.env.NEXTAUTH_URL}/settings`;

    // Upsert Stripe customer for the workspace.
    const subscription = await prisma.workspaceSubscription.findUnique({
      where: { workspaceId: membership.workspaceId },
    });

    let customerId = subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email ?? undefined,
        metadata: { workspaceId: membership.workspaceId },
      });
      customerId = customer.id;

      await prisma.workspaceSubscription.upsert({
        where: { workspaceId: membership.workspaceId },
        create: {
          workspaceId: membership.workspaceId,
          stripeCustomerId: customerId,
          plan: "free",
          status: "active",
        },
        update: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: getPriceId(plan), quantity: 1 }],
      success_url: `${returnUrl}?stripe=success`,
      cancel_url: `${returnUrl}?stripe=cancel`,
      metadata: { workspaceId: membership.workspaceId, plan },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    return jsonError(error);
  }
}
