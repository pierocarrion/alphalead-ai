import type { LoadStatus, WorkloadPoint, WorkloadBalance } from "../entities/Workload";
import type {
  PsychologicalSafety,
  SafetyStatus,
} from "../entities/PsychologicalSafety";
import type {
  ProductivityRisk,
  RiskLevel,
} from "../entities/ProductivityRisk";
import type { EmotionalState } from "../entities/Employee";
import {
  classifyLoadStatus,
  classifyRiskLevel,
  classifySafetyStatus,
} from "../entities/Alert";

const DEFAULT_CAPACITY_HOURS_PER_WEEK = 40;
const MINUTES_PER_HOUR = 60;

export interface WorkloadRaw {
  employeeId: string;
  name: string;
  totalTasks: number;
  estimatedMinutes: number;
  workedMinutes: number;
}

export function clampPct(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function computeOccupationPct(
  workedHours: number,
  estimatedHours: number,
  capacityHours: number
): number {
  const numerator = workedHours > 0 ? workedHours : estimatedHours;
  if (capacityHours <= 0) return 0;
  return (numerator / capacityHours) * 100;
}

export function buildWorkloadPoint(
  raw: WorkloadRaw,
  capacityHours: number
): WorkloadPoint {
  const estimatedHours = raw.estimatedMinutes / MINUTES_PER_HOUR;
  const workedHours = raw.workedMinutes / MINUTES_PER_HOUR;
  const occupationPct = computeOccupationPct(
    workedHours,
    estimatedHours,
    capacityHours
  );
  const status: LoadStatus = classifyLoadStatus(occupationPct);
  return {
    employeeId: raw.employeeId,
    name: raw.name,
    totalTasks: raw.totalTasks,
    estimatedHours: round1(estimatedHours),
    workedHours: round1(workedHours),
    capacityHours,
    occupationPct: round1(occupationPct),
    availableHours: round1(Math.max(0, capacityHours - workedHours)),
    status,
    overload: status === "overload",
  };
}

export function buildWorkloadBalance(
  points: WorkloadPoint[]
): WorkloadBalance {
  const teamCapacityHours = points.reduce((a, p) => a + p.capacityHours, 0);
  const teamWorkedHours = points.reduce((a, p) => a + p.workedHours, 0);
  const averageOccupationPct =
    teamCapacityHours > 0 ? (teamWorkedHours / teamCapacityHours) * 100 : 0;
  const overloadedCount = points.filter((p) => p.overload).length;
  return {
    points,
    averageOccupationPct: round1(averageOccupationPct),
    teamCapacityHours: round1(teamCapacityHours),
    teamWorkedHours: round1(teamWorkedHours),
    overloadedCount,
  };
}

export function defaultCapacityHoursPerWeek(): number {
  return DEFAULT_CAPACITY_HOURS_PER_WEEK;
}

export interface SafetyInput {
  surveyAvg: number;
  feedbackAvg: number;
  participationRate: number;
  sentimentScore: number;
  trend: { date: string; score: number }[];
}

export function computePsychologicalSafetyScore(input: SafetyInput): {
  score: number;
  status: SafetyStatus;
  breakdown: PsychologicalSafety["breakdown"];
} {
  const survey = clampPct(input.surveyAvg);
  const feedback = clampPct(input.feedbackAvg);
  const participation = clampPct(input.participationRate);
  const sentiment = clampPct(input.sentimentScore);

  const score = clampPct(
    survey * 0.5 + feedback * 0.2 + participation * 0.15 + sentiment * 0.15
  );
  return {
    score: round1(score),
    status: classifySafetyStatus(score),
    breakdown: {
      survey: round1(survey),
      feedback: round1(feedback),
      participation: round1(participation),
      sentiment: round1(sentiment),
    },
  };
}

export interface RiskInput {
  overloadRatio: number;
  overdueRatio: number;
  activityDeclinePct: number;
  participationRate: number;
  taskMissRatio: number;
  absenteeismPct: number;
}

export function computeProductivityRiskScore(input: RiskInput): {
  score: number;
  level: RiskLevel;
  breakdown: ProductivityRisk["breakdown"];
} {
  const overload = clampPct(input.overloadRatio * 100);
  const overdue = clampPct(input.overdueRatio * 100);
  const activityDecline = clampPct(input.activityDeclinePct);
  const lowParticipation = clampPct(100 - input.participationRate);
  const taskMiss = clampPct(input.taskMissRatio * 100);
  const absenteeism = clampPct(input.absenteeismPct);

  const score = clampPct(
    overload * 0.22 +
      overdue * 0.22 +
      activityDecline * 0.18 +
      lowParticipation * 0.13 +
      taskMiss * 0.15 +
      absenteeism * 0.1
  );
  return {
    score: round1(score),
    level: classifyRiskLevel(score),
    breakdown: {
      overload: round1(overload),
      overdue: round1(overdue),
      activityDecline: round1(activityDecline),
      lowParticipation: round1(lowParticipation),
      taskMiss: round1(taskMiss),
      absenteeism: round1(absenteeism),
    },
  };
}

export function computeGrowthIndex(input: {
  coursesCompletedPct: number;
  newSkillsPct: number;
  certificationsPct: number;
  sustainableProductivity: number;
  participation: number;
}): number {
  const courses = clampPct(input.coursesCompletedPct);
  const skills = clampPct(input.newSkillsPct);
  const certs = clampPct(input.certificationsPct);
  const productivity = clampPct(input.sustainableProductivity);
  const participation = clampPct(input.participation);

  return round1(
    clampPct(
      courses * 0.25 +
        skills * 0.25 +
        certs * 0.2 +
        productivity * 0.15 +
        participation * 0.15
    )
  );
}

export function sentimentScoreFromRates(
  positiveRate: number,
  riskRate: number
): number {
  const net = positiveRate - riskRate;
  return clampPct(50 + net * 50);
}

export function classifySentiment(score: number): EmotionalState {
  if (score >= 66) return "positive";
  if (score >= 40) return "neutral";
  return "risk";
}

export function round1(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}
