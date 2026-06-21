import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const body = (await request.json()) as { completed?: boolean };

  const existing = await prisma.ritualSession.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Ritual not found" }, { status: 404 });
  }

  const completedAt = body.completed ? new Date() : existing.completedAt;

  const ritual = await prisma.ritualSession.update({
    where: { id },
    data: { completedAt },
  });

  if (body.completed && existing.taskId) {
    await prisma.task.update({
      where: { id: existing.taskId },
      data: { status: "done", completedAt: new Date() },
    });
  }

  return NextResponse.json({ ritual });
}
