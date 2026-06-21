import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { getStripe, getPriceId } from "@/server/lib/stripe";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: { include: { workspace: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const membership = user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  const body = (await request.json()) as { plan?: "team" | "business"; returnUrl?: string };
  const plan = body.plan === "business" ? "business" : "team";
  const returnUrl = body.returnUrl ?? `${process.env.NEXTAUTH_URL}/settings`;

  // Upsert Stripe customer for the workspace.
  let subscription = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId: membership.workspaceId },
  });

  let customerId = subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: session.user.email,
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
}
