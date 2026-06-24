import type {
  GoalProgress,
  ProgressStatus,
  SmartGoalSnapshot,
} from "../entities/SmartGoal";

const DAY_MS = 24 * 60 * 60 * 1000;

export const LOAD_WEIGHT: Record<string, number> = {
  Light: 1,
  Medium: 2,
  Heavy: 3,
};

export function taskWeight(load: string): number {
  return LOAD_WEIGHT[load] ?? 1;
}

/** Total weighted capacity of a snapshot (milestones 40% / tasks 60%). */
export function totalCapacity(snapshot: SmartGoalSnapshot): {
  milestoneTotal: number;
  taskTotal: number;
} {
  const milestoneTotal = Math.max(snapshot.milestones.length, 1);
  const taskTotal = snapshot.tasks.reduce(
    (sum, t) => sum + taskWeight(t.load),
    0
  );
  return { milestoneTotal, taskTotal };
}

/**
 * Core progress engine. Combines milestone completion (40%) and task completion
 * (60%), then compares against a linear time-elapsed expectation to derive a
 * status, velocity and pace.
 *
 * Deterministic and side-effect free.
 */
export function computeProgress(
  snapshot: SmartGoalSnapshot,
  now: Date = new Date()
): GoalProgress {
  const { milestones, tasks, goal } = snapshot;

  if (goal.status === "completed") {
    return {
      goalProgress: 100,
      expectedProgress: 100,
      pending: 0,
      status: "Completed",
      velocity: 0,
      pace: "Steady",
    };
  }

  const { milestoneTotal, taskTotal } = totalCapacity(snapshot);

  const completedMilestones = milestones.filter((m) => m.status === "completed");
  const milestoneRatio =
    milestoneTotal === 0 ? 0 : completedMilestones.length / milestoneTotal;

  const completedTaskWeight = tasks
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + taskWeight(t.load), 0);
  const taskRatio = taskTotal === 0 ? 0 : completedTaskWeight / taskTotal;

  // If a goal has only tasks or only milestones, collapse to that single signal.
  const hasTasks = tasks.length > 0;
  const hasMilestones = milestones.length > 0;
  let goalProgress: number;
  if (hasTasks && hasMilestones) {
    goalProgress = 100 * (0.4 * milestoneRatio + 0.6 * taskRatio);
  } else if (hasTasks) {
    goalProgress = 100 * taskRatio;
  } else if (hasMilestones) {
    goalProgress = 100 * milestoneRatio;
  } else {
    goalProgress = 0;
  }
  goalProgress = clamp(Math.round(goalProgress), 0, 99);

  const expectedProgress = computeExpectedProgress(goal.createdAt, goal.deadline, now);
  const elapsedDays = Math.max((now.getTime() - goal.createdAt.getTime()) / DAY_MS, 1);
  const elapsedWeeks = Math.max(elapsedDays / 7, 0.5);
  const velocity = Number((completedTaskWeight / elapsedWeeks).toFixed(2));

  const status = deriveStatus(goalProgress, expectedProgress, goal.deadline, now);
  const pace = derivePace(goalProgress, expectedProgress);

  return {
    goalProgress,
    expectedProgress,
    pending: 100 - goalProgress,
    status,
    velocity,
    pace,
  };
}

export function computeExpectedProgress(
  createdAt: Date,
  deadline: Date | null,
  now: Date
): number {
  if (!deadline) return 50;
  const start = createdAt.getTime();
  const end = deadline.getTime();
  const nowMs = now.getTime();
  if (end <= start) return 100;
  const ratio = (nowMs - start) / (end - start);
  return clamp(Math.round(ratio * 100), 0, 100);
}

function deriveStatus(
  progress: number,
  expected: number,
  deadline: Date | null,
  now: Date
): ProgressStatus {
  if (progress <= 0) return "Not Started";
  const gap = expected - progress;
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - now.getTime()) / DAY_MS)
    : Number.POSITIVE_INFINITY;
  if (gap >= 20 || (gap >= 10 && daysLeft <= 7)) return "At Risk";
  if (gap >= 8) return "Behind Schedule";
  if (progress - expected >= 8) return "Ahead";
  return "On Track";
}

function derivePace(
  progress: number,
  expected: number
): "Slow" | "Steady" | "Fast" {
  const diff = progress - expected;
  if (diff >= 8) return "Fast";
  if (diff <= -8) return "Slow";
  return "Steady";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
