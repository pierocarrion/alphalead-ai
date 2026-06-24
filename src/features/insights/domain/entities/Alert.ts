import type { EmotionalState } from "./Employee";
import type { LoadStatus } from "./Workload";
import type { RiskLevel } from "./ProductivityRisk";
import type { SafetyStatus } from "./PsychologicalSafety";

export type AlertSeverity = "info" | "warning" | "critical";

export interface TeamAlert {
  id: string;
  severity: AlertSeverity;
  type:
    | "overload"
    | "emotional_risk"
    | "stagnation"
    | "productivity_risk";
  employeeId: string | null;
  employeeName: string | null;
  message: string;
  value?: number;
  threshold?: number;
  createdAt: string;
}

export interface AlertThresholds {
  overloadPct: number;
  safetyCritical: number;
  stagnationDays: number;
  productivityHigh: number;
  loadStatus: { balanced: number; moderate: number };
  safetyStatus: { critical: number; moderate: number };
  riskLevel: { low: number; moderate: number };
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  overloadPct: 120,
  safetyCritical: 50,
  stagnationDays: 30,
  productivityHigh: 70,
  loadStatus: { balanced: 85, moderate: 120 },
  safetyStatus: { critical: 40, moderate: 70 },
  riskLevel: { low: 40, moderate: 70 },
};

export function classifyLoadStatus(
  occupationPct: number,
  thresholds: { balanced: number; moderate: number } = DEFAULT_THRESHOLDS.loadStatus
): LoadStatus {
  if (occupationPct <= thresholds.balanced) return "balanced";
  if (occupationPct <= thresholds.moderate) return "moderate";
  return "overload";
}

export function classifySafetyStatus(
  score: number,
  thresholds: { critical: number; moderate: number } = DEFAULT_THRESHOLDS.safetyStatus
): SafetyStatus {
  if (score < thresholds.critical) return "critical";
  if (score < thresholds.moderate) return "moderate";
  return "healthy";
}

export function classifyRiskLevel(
  score: number,
  thresholds: { low: number; moderate: number } = DEFAULT_THRESHOLDS.riskLevel
): RiskLevel {
  if (score < thresholds.low) return "low";
  if (score < thresholds.moderate) return "moderate";
  return "high";
}

export function sentimentToEmoji(state: EmotionalState): string {
  if (state === "positive") return "\u{1F60A}";
  if (state === "neutral") return "\u{1F610}";
  return "\u{2639}\u{FE0F}";
}
