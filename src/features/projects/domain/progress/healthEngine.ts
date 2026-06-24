import type {
  HealthReport,
  SmartGoalSnapshot,
} from "../entities/SmartGoal";
import { computeProgress, totalCapacity } from "./progressEngine";
import { validateSmartGoal } from "./smartValidator";

/**
 * Project Health Analyzer. Blends delivery confidence, burn rate, team
 * efficiency and goal alignment into a single 0-100 health score.
 *
 * Deterministic and side-effect free.
 */
export function computeHealth(
  snapshot: SmartGoalSnapshot,
  now: Date = new Date()
): HealthReport {
  const { goal, tasks, members } = snapshot;
  const progress = computeProgress(snapshot, now);
  const validation = validateSmartGoal(goal);

  const { taskTotal } = totalCapacity(snapshot);
  const completedTaskWeight = progress.velocity > 0
    ? snapshot.tasks
        .filter((t) => t.status === "done")
        .reduce((s, t) => {
          const w = t.load === "Heavy" ? 3 : t.load === "Medium" ? 2 : 1;
          return s + w;
        }, 0)
    : 0;
  const burnRate = taskTotal > 0 ? completedTaskWeight / taskTotal : 0;

  const deliveryConfidence = clamp(
    100 - Math.max(progress.expectedProgress - progress.goalProgress, 0) * 1.5
  );

  const openTasks = tasks.filter((t) => t.status === "open");
  const teamEfficiency = members.length > 0
    ? clamp(100 - (openTasks.length / members.length) * 6)
    : clamp(100 - openTasks.length * 4);

  const goalAlignment = validation.score;

  const healthScore = clamp(
    Math.round(
      deliveryConfidence * 0.4 +
        Math.min(burnRate * 100, 100) * 0.2 +
        teamEfficiency * 0.25 +
        goalAlignment * 0.15
    )
  );

  return {
    healthScore,
    deliveryConfidence: clamp(Math.round(deliveryConfidence)),
    burnRate: Number(burnRate.toFixed(2)),
    teamEfficiency: clamp(Math.round(teamEfficiency)),
    goalAlignment,
  };
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}
