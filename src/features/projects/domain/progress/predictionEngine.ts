import type {
  Prediction,
  RiskLevel,
  SmartGoalSnapshot,
} from "../entities/SmartGoal";
import { computeProgress, taskWeight, totalCapacity } from "./progressEngine";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Predictive Completion Engine. Uses historical velocity (completed task weight
 * per elapsed week) to project an estimated finish date and a probability of
 * meeting the deadline.
 *
 * Deterministic and side-effect free.
 */
export function predictCompletion(
  snapshot: SmartGoalSnapshot,
  now: Date = new Date()
): Prediction {
  const { goal, tasks } = snapshot;

  const progress = computeProgress(snapshot, now);

  if (progress.goalProgress >= 100) {
    return {
      completionProbability: 100,
      estimatedFinishDate: now.toISOString(),
      riskLevel: "low",
      daysEarlyOrLate: goal.deadline
        ? Math.round((now.getTime() - goal.deadline.getTime()) / DAY_MS)
        : 0,
    };
  }

  const { taskTotal } = totalCapacity(snapshot);
  const completedTaskWeight = tasks
    .filter((t) => t.status === "done")
    .reduce((s, t) => s + taskWeight(t.load), 0);
  const remainingTaskWeight = Math.max(taskTotal - completedTaskWeight, 0);

  const elapsedDays = Math.max(
    (now.getTime() - goal.createdAt.getTime()) / DAY_MS,
    1
  );
  const elapsedWeeks = Math.max(elapsedDays / 7, 0.5);
  const velocityPerWeek = completedTaskWeight / elapsedWeeks;

  let estimatedFinishMs: number | null = null;
  if (velocityPerWeek > 0 && remainingTaskWeight > 0) {
    const weeksRemaining = remainingTaskWeight / velocityPerWeek;
    estimatedFinishMs = now.getTime() + weeksRemaining * 7 * DAY_MS;
  } else if (remainingTaskWeight === 0) {
    estimatedFinishMs = now.getTime();
  }

  const estimatedFinishDate = estimatedFinishMs
    ? new Date(estimatedFinishMs).toISOString()
    : null;

  const { probability, riskLevel, daysEarlyOrLate } = deriveProbability(
    progress,
    estimatedFinishMs,
    goal.deadline,
    now
  );

  return {
    completionProbability: probability,
    estimatedFinishDate,
    riskLevel,
    daysEarlyOrLate,
  };
}

function deriveProbability(
  progress: { goalProgress: number; expectedProgress: number },
  estimatedFinishMs: number | null,
  deadline: Date | null,
  now: Date
): { probability: number; riskLevel: RiskLevel; daysEarlyOrLate: number } {
  const gap = progress.expectedProgress - progress.goalProgress;

  if (!deadline) {
    const probability = clamp(95 - Math.max(gap, 0) * 2);
    return {
      probability,
      riskLevel: probability >= 70 ? "low" : probability >= 45 ? "medium" : "high",
      daysEarlyOrLate: 0,
    };
  }

  const daysEarlyOrLate = estimatedFinishMs
    ? Math.round((estimatedFinishMs - deadline.getTime()) / DAY_MS)
    : Math.round((now.getTime() - deadline.getTime()) / DAY_MS);

  let probability: number;
  if (estimatedFinishMs === null) {
    probability = clamp(50 - gap);
  } else if (estimatedFinishMs <= deadline.getTime()) {
    probability = clamp(95 - Math.max(gap, 0));
  } else {
    const daysLate = Math.round((estimatedFinishMs - deadline.getTime()) / DAY_MS);
    probability = clamp(80 - daysLate * 2 - Math.max(gap, 0));
  }

  let riskLevel: RiskLevel = "low";
  if (probability < 35) riskLevel = "critical";
  else if (probability < 55) riskLevel = "high";
  else if (probability < 75) riskLevel = "medium";

  return { probability, riskLevel, daysEarlyOrLate };
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
