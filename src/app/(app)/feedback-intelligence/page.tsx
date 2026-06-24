import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { getActiveWorkspace } from "@/server/lib/activeWorkspace";
import {
  aggregateMetrics,
  METRIC_KEYS,
  MIN_RESPONSES_FOR_INSIGHT,
  CAMPAIGN_PRESETS,
} from "@/server/lib/feedbackIntelligence";
import { FeedbackIntelligenceClient } from "./FeedbackIntelligenceClient";

export default async function FeedbackIntelligencePage() {
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

  const [campaigns, responses] = await Promise.all([
    prisma.feedbackCampaign.findMany({
      where: { workspaceId: active.workspaceId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { responses: true } } },
    }),
    prisma.feedbackResponse.findMany({
      where: { workspaceId: active.workspaceId },
      orderBy: { createdAt: "desc" },
      select: { sentiment: true, emotion: true, scores: true, createdAt: true },
      take: 500,
    }),
  ]);

  const metrics = aggregateMetrics(
    responses as Array<{ sentiment: string | null; scores: unknown }>
  );

  return (
    <FeedbackIntelligenceClient
      leaderName={user.name ?? "Líder"}
      campaigns={campaigns.map((c) => ({
        id: c.id,
        title: c.title,
        kind: c.kind,
        cadence: c.cadence,
        status: c.status,
        responses: c._count.responses,
        createdAt: c.createdAt.toISOString(),
      }))}
      metrics={metrics}
      metricKeys={METRIC_KEYS}
      minForInsight={MIN_RESPONSES_FOR_INSIGHT}
      presets={CAMPAIGN_PRESETS.map((p) => ({ kind: p.kind, title: p.title, cadence: p.cadence }))}
    />
  );
}
