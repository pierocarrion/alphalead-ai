import type {
  Contribution,
  ContributionReport,
  SmartGoalSnapshot,
} from "../entities/SmartGoal";
import { taskWeight } from "./progressEngine";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A small, warm palette for the cylinder contribution layers. Indexed by
 * position so each contributor gets a distinct, stable color.
 */
export const CONTRIBUTION_COLORS = [
  "#7c9cff", // indigo
  "#f5a3a3", // rose
  "#8fe0b0", // mint
  "#ffd28a", // amber
  "#c4a6e8", // lavender
  "#8fd2e0", // sky
  "#e8b08a", // peach
  "#a8a8d0", // slate
];

/**
 * Contribution Distribution + Individual Scoring engine.
 *
 * Each member earns weight points for the tasks they complete (weighted by load)
 * plus a share of every completed milestone (attributed to the goal owner by
 * default — the repository can refine ownership later). Those points are
 * normalized to a share of total progress, and five 0-100 scores are derived.
 *
 * Deterministic and side-effect free.
 */
export function computeContributions(
  snapshot: SmartGoalSnapshot,
  now: Date = new Date()
): ContributionReport {
  const { tasks, milestones, members, goal } = snapshot;

  const pointsByUser = new Map<string, number>();

  const addPoints = (userId: string, pts: number) => {
    pointsByUser.set(userId, (pointsByUser.get(userId) ?? 0) + pts);
  };

  let totalPoints = 0;

  for (const t of tasks) {
    const pts = taskWeight(t.load) * (t.status === "done" ? 1 : 0);
    if (pts > 0) {
      addPoints(t.userId, pts);
      totalPoints += pts;
    }
  }

  // Milestone completion is attributed to the goal owner (configurable later).
  const milestoneBonus = 2;
  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  if (completedMilestones > 0 && goal.ownerId) {
    addPoints(goal.ownerId, completedMilestones * milestoneBonus);
    totalPoints += completedMilestones * milestoneBonus;
  }

  if (totalPoints === 0 || members.length === 0) {
    return { members: [], teamShare: 0 };
  }

  const results: Contribution[] = members.map((m, index) => {
    const rawPoints = pointsByUser.get(m.userId) ?? 0;
    const share = totalPoints > 0 ? Math.round((rawPoints / totalPoints) * 100) : 0;

    const userTasks = tasks.filter((t) => t.userId === m.userId);
    const completed = userTasks.filter((t) => t.status === "done");
    const completionRate = userTasks.length
      ? completed.length / userTasks.length
      : 0;

    const avgLoadWeight =
      userTasks.length > 0
        ? userTasks.reduce((s, t) => s + taskWeight(t.load), 0) / userTasks.length
        : 1;

    const onTime = completed.filter(
      (t) => !t.completedAt || (goal.deadline && t.completedAt.getTime() <= goal.deadline.getTime())
    ).length;
    const reliability = completed.length ? Math.round((onTime / completed.length) * 100) : 60;

    return {
      userId: m.userId,
      name: m.name,
      share,
      contributionScore: clamp(Math.round(share * 1.1 + completionRate * 20)),
      deliveryScore: clamp(Math.round(completionRate * 80 + avgLoadWeight * 5)),
      qualityScore: clamp(Math.round(completionRate * 70 + reliability * 0.3)),
      collaborationScore: clamp(Math.round((members.length > 1 ? 60 : 40) + completionRate * 30)),
      reliabilityScore: reliability,
      color: CONTRIBUTION_COLORS[index % CONTRIBUTION_COLORS.length],
    };
  });

  // Keep only contributors with measurable activity, but always surface at least
  // the top members so the leader can see the distribution.
  const sorted = results.sort((a, b) => b.share - a.share);
  const attributed = sorted.filter((c) => c.share > 0);
  const attributedShare = attributed.reduce((s, c) => s + c.share, 0);
  const teamShare = clamp(100 - attributedShare, 0, 100);

  // If nobody has attributed points yet, still show all members at 0.
  const visible = attributed.length > 0 ? attributed : sorted;

  void now; // reserved for future velocity-weighted scoring

  return { members: visible, teamShare };
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY_MS);
}
