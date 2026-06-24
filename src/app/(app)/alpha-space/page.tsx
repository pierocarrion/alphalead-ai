import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { getActiveWorkspace } from "@/server/lib/activeWorkspace";
import { getWeeklyLimit, startOfWeek } from "@/server/lib/alphaSpace";
import { AlphaSpaceClient } from "./AlphaSpaceClient";

export default async function AlphaSpacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true },
  });
  if (!user) redirect("/login");

  const { active } = await getActiveWorkspace(user.id);
  if (!active || (active.role !== "leader" && active.role !== "admin")) {
    redirect("/home");
  }

  const sub = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId: active.workspaceId },
    select: { plan: true },
  });
  const plan = sub?.plan ?? "team";
  const limit = getWeeklyLimit(plan);
  const since = startOfWeek();
  const usedThisWeek = await prisma.alphaSession.count({
    where: { userId: user.id, workspaceId: active.workspaceId, createdAt: { gte: since } },
  });

  const sessions = await prisma.alphaSession.findMany({
    where: { userId: user.id, workspaceId: active.workspaceId },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      framework: true,
      challenge: true,
      status: true,
      step: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      _count: { select: { messages: true } },
    },
  });

  const serializedSessions = sessions.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    completedAt: s.completedAt ? s.completedAt.toISOString() : null,
  }));

  return (
    <AlphaSpaceClient
      leaderName={user.name ?? "Líder"}
      sessions={serializedSessions}
      weeklyLimit={limit}
      usedThisWeek={usedThisWeek}
      plan={plan}
    />
  );
}
