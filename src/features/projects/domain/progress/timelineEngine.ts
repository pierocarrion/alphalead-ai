import type {
  Insight,
  SmartGoalSnapshot,
  TimelineEvent,
} from "../entities/SmartGoal";
import { computeContributions } from "./contributionEngine";
import { computeProgress } from "./progressEngine";

/**
 * AI Timeline Generator. Builds a reverse-chronological timeline from goal
 * creation, milestone/task completions and deadline markers.
 *
 * Deterministic and side-effect free.
 */
export function buildTimeline(snapshot: SmartGoalSnapshot): TimelineEvent[] {
  const { goal, milestones, tasks, members } = snapshot;
  const nameFor = (userId: string | null) =>
    userId ? members.find((m) => m.userId === userId)?.name ?? null : null;

  const events: TimelineEvent[] = [
    {
      id: `goal-${goal.id}`,
      date: goal.createdAt.toISOString(),
      type: "goal_created",
      title: `Objetivo creado: ${goal.title}`,
      responsible: nameFor(goal.ownerId),
      impact: "high",
    },
  ];

  for (const m of milestones) {
    if (m.status === "completed") {
      events.push({
        id: `milestone-${m.id}`,
        date: (m.dueDate ?? m.createdAt).toISOString(),
        type: "milestone",
        title: `Hito completado: ${m.title}`,
        responsible: nameFor(goal.ownerId),
        impact: "high",
      });
    }
  }

  for (const t of tasks) {
    if (t.status === "done" && t.completedAt) {
      events.push({
        id: `task-${t.id}`,
        date: t.completedAt.toISOString(),
        type: "task_done",
        title: t.title,
        responsible: nameFor(t.userId),
        impact: t.load === "Heavy" ? "high" : t.load === "Medium" ? "medium" : "low",
      });
    }
  }

  if (goal.deadline) {
    events.push({
      id: `deadline-${goal.id}`,
      date: goal.deadline.toISOString(),
      type: "deadline",
      title: "Fecha límite del objetivo",
      responsible: null,
      impact: "high",
    });
  }

  return events.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Heuristic Insight Engine. Produces warm, non-shaming observations the leader
 * can act on. The AI layer (Gemini) may enrich or replace these.
 *
 * Deterministic and side-effect free.
 */
export function generateHeuristicInsights(
  snapshot: SmartGoalSnapshot,
  now: Date = new Date()
): Insight[] {
  const insights: Insight[] = [];
  const progress = computeProgress(snapshot, now);
  const contributions = computeContributions(snapshot, now);

  const gap = progress.expectedProgress - progress.goalProgress;
  if (gap >= 8) {
    insights.push({
      id: "gap",
      kind: "gap",
      text: `El proyecto avanza un ${Math.max(gap, 1)}% por debajo del ritmo esperado.`,
    });
  } else if (progress.goalProgress - progress.expectedProgress >= 8) {
    const lead = Math.round(progress.goalProgress - progress.expectedProgress);
    insights.push({
      id: "win-pace",
      kind: "win",
      text: `Vas ${lead}% por encima del ritmo esperado. Buen momento.`,
    });
  }

  const top = contributions.members[0];
  if (top && top.share >= 30 && contributions.members.length >= 2) {
    insights.push({
      id: "concentration",
      kind: "concentration",
      text: `${top.name} concentra el ${top.share}% de las contribuciones.`,
    });
  }

  if (contributions.members.length >= 2) {
    const idle = contributions.members.filter((c) => c.share === 0);
    if (idle.length > 0) {
      insights.push({
        id: "recommendation",
        kind: "recommendation",
        text: `Hay ${idle.length} ${
          idle.length === 1 ? "persona sin aportes" : "personas sin aportes"
        } registrados. Considera redistribuir tareas.`,
      });
    }
  }

  if (progress.status === "At Risk" || progress.status === "Behind Schedule") {
    insights.push({
      id: "risk",
      kind: "risk",
      text: `Existe un riesgo ${
        progress.status === "At Risk" ? "alto" : "moderado"
      } de incumplir la fecha límite.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "steady",
      kind: "win",
      text: "El proyecto avanza al ritmo esperado. Todo en calma por ahora.",
    });
  }

  return insights;
}
