import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/lib/prisma";
import { jsonError, parseRequestBody, toFriendlyMessage } from "@/server/lib/apiErrors";
import { requireUser } from "@/server/lib/auth";

const bodySchema = z.object({
  taskId: z.string().min(1),
  feeling: z.string().optional(),
  durationSec: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const user = auth.user;

    const parsed = bodySchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: toFriendlyMessage(parsed.error) },
        { status: 400 }
      );
    }

    const { taskId, feeling, durationSec } = parsed.data;

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    });
    if (!task) {
      return NextResponse.json(
        { error: "We couldn't find that task." },
        { status: 404 }
      );
    }

    const ritual = await prisma.ritualSession.create({
      data: {
        userId: user.id,
        taskId: task.id,
        feeling: feeling ?? null,
        durationSec: durationSec ?? 120,
        startedAt: new Date(),
      },
    });

    return NextResponse.json({ ritual });
  } catch (error) {
    return jsonError(error);
  }
}
