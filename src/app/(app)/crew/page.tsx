import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { CrewClient } from "./CrewClient";
import type { PersonId } from "@/shared/ui";

export default async function CrewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });
  if (!user) redirect("/login");

  const warm = user.profile?.tone === "balanced" ? false : true;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: "acme" },
    include: {
      memberships: { include: { user: { select: { id: true, name: true } } } },
      goals: { include: { milestones: { orderBy: { dueDate: "asc" } } }, take: 1 },
      teamMetrics: { orderBy: { date: "desc" } },
    },
  });

  if (!workspace) redirect("/home");

  const moodMetric = workspace.teamMetrics.find((m) => m.type === "mood");
  const loadMetric = workspace.teamMetrics.find((m) => m.type === "load_balance");

  const mood = {
    value: moodMetric?.value ?? 0.62,
    label: (moodMetric?.metadata as string) ?? "A little tense",
    note:
      "The launch is bunching everyone up. That’s the system, not any one person.",
  };

  const loadGuardian = loadMetric
    ? {
        who: "theo" as PersonId,
        title: "Theo’s been catching most of the launch work.",
        note: "He’s the one who procrastinates least — so the load drifts to him. Want to even it out?",
      }
    : null;

  const goal = workspace.goals[0];
  const milestone = goal?.milestones[0]
    ? {
        title: goal.milestones[0].title,
        due: goal.milestones[0].dueDate
          ? formatDaysUntil(goal.milestones[0].dueDate)
          : "Soon",
        contributors: ["maya", "sofia", "theo"] as PersonId[],
      }
    : null;

  const pair = { who: "sofia" as PersonId, available: true };

  return (
    <CrewClient
      warm={warm}
      mood={mood}
      loadGuardian={loadGuardian}
      milestone={milestone}
      pair={pair}
    />
  );
}

function formatDaysUntil(dueDate: Date): string {
  const days = Math.max(
    1,
    Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  return `In about ${days} days`;
}
