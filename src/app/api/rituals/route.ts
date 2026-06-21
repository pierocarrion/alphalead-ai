import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    taskId: string;
    feeling?: string;
    durationSec?: number;
  };

  if (!body.taskId) {
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  }

  const task = await prisma.task.findFirst({
    where: { id: body.taskId, userId: user.id },
  });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const ritual = await prisma.ritualSession.create({
    data: {
      userId: user.id,
      taskId: task.id,
      feeling: body.feeling ?? null,
      durationSec: body.durationSec ?? 120,
      startedAt: new Date(),
    },
  });

  return NextResponse.json({ ritual });
}
