import type {
  RiskSignal,
  SmartGoalSnapshot,
} from "../entities/SmartGoal";
import { computeProgress } from "./progressEngine";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Risk Detection Engine. Surfaces schedule, overload, blocked and stalled risks
 * and classifies each as low / medium / high / critical.
 *
 * Deterministic and side-effect free.
 */
export function detectRisks(
  snapshot: SmartGoalSnapshot,
  now: Date = new Date()
): RiskSignal[] {
  const { goal, tasks, milestones, members } = snapshot;
  const signals: RiskSignal[] = [];

  if (milestones.length === 0 && tasks.length === 0) {
    signals.push({
      id: "no-work",
      level: "medium",
      type: "no_milestones",
      title: "Sin hitos ni tareas",
      detail:
        "El objetivo aún no tiene trabajo desglosado. Agrega hitos y tareas para empezar a medir el avance.",
    });
    return signals;
  }

  const progress = computeProgress(snapshot, now);
  const gap = progress.expectedProgress - progress.goalProgress;

  if (gap >= 20) {
    signals.push({
      id: "behind-critical",
      level: "critical",
      type: "behind_schedule",
      title: "Muy por detrás del ritmo esperado",
      detail: `Vas ${gap}% por debajo del avance esperado (${progress.goalProgress}% vs ${progress.expectedProgress}%).`,
    });
  } else if (gap >= 10) {
    signals.push({
      id: "behind",
      level: "high",
      type: "behind_schedule",
      title: "Por detrás del ritmo esperado",
      detail: `Vas ${gap}% por debajo del ritmo esperado.`,
    });
  } else if (gap >= 8) {
    signals.push({
      id: "behind-low",
      level: "medium",
      type: "behind_schedule",
      title: "Ligeramente retrasado",
      detail: `Estás ${gap}% por debajo del ritmo esperado.`,
    });
  }

  if (goal.deadline) {
    const daysLeft = Math.ceil((goal.deadline.getTime() - now.getTime()) / DAY_MS);
    if (daysLeft <= 0 && progress.goalProgress < 100) {
      signals.push({
        id: "deadline-passed",
        level: "critical",
        type: "deadline_close",
        title: "Fecha límite vencida",
        detail: "La fecha límite del objetivo ya pasó y aún no está completo.",
      });
    } else if (daysLeft > 0 && daysLeft <= 7 && progress.pending > 30) {
      signals.push({
        id: "deadline-soon",
        level: "high",
        type: "deadline_close",
        title: "Fecha límite cercana",
        detail: `Quedan ${daysLeft} días y aún falta ${progress.pending}% por completar.`,
      });
    } else if (daysLeft > 0 && daysLeft <= 14 && progress.pending > 50) {
      signals.push({
        id: "deadline-soon-med",
        level: "medium",
        type: "deadline_close",
        title: "Fecha límite en vista",
        detail: `Quedan ${daysLeft} días y falta ${progress.pending}%.`,
      });
    }
  }

  // Overload: any member holding >= 60% of open tasks in a team of 2+.
  if (members.length >= 2) {
    const openTasks = tasks.filter((t) => t.status === "open");
    if (openTasks.length >= 4) {
      const byUser = new Map<string, number>();
      for (const t of openTasks) {
        byUser.set(t.userId, (byUser.get(t.userId) ?? 0) + 1);
      }
      const totalOpen = openTasks.length;
      for (const [userId, count] of byUser) {
        if (count / totalOpen >= 0.6) {
          const member = members.find((m) => m.userId === userId);
          signals.push({
            id: `overload-${userId}`,
            level: "medium",
            type: "overload",
            title: `Carga concentrada en ${member?.name ?? "un miembro"}`,
            detail: `${count} de ${totalOpen} tareas abiertas están con esta persona.`,
            userId,
          });
        }
      }
    }
  }

  // Stalled: no completed task or milestone in the last 7 days.
  const since = new Date(now.getTime() - 7 * DAY_MS);
  const recentCompletion =
    tasks.some((t) => t.status === "done" && t.completedAt && t.completedAt >= since) ||
    milestones.some(
      (m) => m.status === "completed" // milestones don't carry completion time; approximate
    );
  const hasOpenWork =
    tasks.some((t) => t.status === "open") ||
    milestones.some((m) => m.status === "pending");
  if (!recentCompletion && hasOpenWork) {
    signals.push({
      id: "stalled",
      level: "medium",
      type: "stalled",
      title: "Sin avances en la última semana",
      detail: "No se completó ninguna tarea ni hito en los últimos 7 días.",
    });
  }

  return signals;
}

export function highestRiskLevel(signals: RiskSignal[]): RiskSignal["level"] | null {
  const order = ["low", "medium", "high", "critical"] as const;
  let highest: RiskSignal["level"] | null = null;
  for (const s of signals) {
    if (!highest || order.indexOf(s.level) > order.indexOf(highest)) {
      highest = s.level;
    }
  }
  return highest;
}
