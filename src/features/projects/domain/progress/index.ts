import type { GoalProgressReport, SmartGoalSnapshot } from "../entities/SmartGoal";
import { computeContributions } from "./contributionEngine";
import { computeHealth } from "./healthEngine";
import { computeProgress } from "./progressEngine";
import { generateHeuristicInsights } from "./timelineEngine";
import { buildTimeline } from "./timelineEngine";
import { detectRisks } from "./riskEngine";
import { predictCompletion } from "./predictionEngine";

export { computeProgress, totalCapacity, taskWeight, computeExpectedProgress } from "./progressEngine";
export { computeContributions, CONTRIBUTION_COLORS } from "./contributionEngine";
export { detectRisks, highestRiskLevel } from "./riskEngine";
export { predictCompletion } from "./predictionEngine";
export { computeHealth } from "./healthEngine";
export { buildTimeline, generateHeuristicInsights } from "./timelineEngine";
export { validateSmartGoal } from "./smartValidator";

/**
 * AI Progress Engine entrypoint. Runs every deterministic engine against a
 * goal snapshot and returns the full composite report consumed by the UI.
 *
 * Pure / synchronous — call from any use-case or route handler.
 */
export function computeGoalProgress(
  snapshot: SmartGoalSnapshot,
  now: Date = new Date()
): GoalProgressReport {
  return {
    goalId: snapshot.goal.id,
    goalTitle: snapshot.goal.title,
    computedAt: now.toISOString(),
    progress: computeProgress(snapshot, now),
    contributions: computeContributions(snapshot, now),
    risks: detectRisks(snapshot, now),
    prediction: predictCompletion(snapshot, now),
    health: computeHealth(snapshot, now),
    timeline: buildTimeline(snapshot),
    insights: generateHeuristicInsights(snapshot, now),
    usedGemini: false,
  };
}
