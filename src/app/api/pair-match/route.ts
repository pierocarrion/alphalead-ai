import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/lib/prisma";
import { jsonError, parseRequestBody, toFriendlyMessage } from "@/server/lib/apiErrors";
import { requireUser } from "@/server/lib/auth";

const postSchema = z.object({
  partnerId: z.string().min(1),
  taskId: z.string().min(1).optional(),
  reason: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const user = auth.user;

    const parsed = postSchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: toFriendlyMessage(parsed.error) },
        { status: 400 }
      );
    }

    const { partnerId, taskId, reason } = parsed.data;

    if (partnerId === user.id) {
      return NextResponse.json(
        { error: "You can't pair up with yourself." },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.findFirst({
      where: { memberships: { some: { userId: user.id } } },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "We couldn't find a workspace for this pair-start." },
        { status: 404 }
      );
    }

    const partnerMembership = await prisma.membership.findFirst({
      where: { workspaceId: workspace.id, userId: partnerId },
    });

    if (!partnerMembership) {
      return NextResponse.json(
        { error: "That person isn't in your workspace." },
        { status: 404 }
      );
    }

    if (taskId) {
      const task = await prisma.task.findFirst({
        where: { id: taskId, userId: user.id },
        select: { id: true },
      });
      if (!task) {
        return NextResponse.json(
          { error: "We couldn't find that task." },
          { status: 404 }
        );
      }
    }

    const match = await prisma.pairMatch.create({
      data: {
        requesterId: user.id,
        partnerId,
        taskId: taskId ?? null,
        reason: reason ?? "Pair-start: begin the same 2 minutes side by side.",
        status: "pending",
      },
      select: {
        id: true,
        requesterId: true,
        partnerId: true,
        taskId: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ match, workspace: { id: workspace.id } });
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const user = auth.user;

    const matches = await prisma.pairMatch.findMany({
      where: {
        OR: [{ requesterId: user.id }, { partnerId: user.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        requesterId: true,
        partnerId: true,
        taskId: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ matches });
  } catch (error) {
    return jsonError(error);
  }
}
