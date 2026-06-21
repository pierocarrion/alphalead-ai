import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["win", "struggle", "testimonial", "metric"]),
  content: z.string().min(1).max(2000),
  metricValue: z.number().optional(),
  tags: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: { take: 1 } },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = (await request.json()) as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const membership = user.memberships[0];
  const feedback = await prisma.feedback.create({
    data: {
      workspaceId: membership?.workspaceId ?? null,
      userId: user.id,
      type: parsed.data.type,
      content: parsed.data.content,
      metricValue: parsed.data.metricValue,
      tags: parsed.data.tags,
    },
  });

  return NextResponse.json({ feedback }, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedback = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ feedback });
}
