/**
 * SMART Goal Progress Tracker — domain entities.
 *
 * These are pure TypeScript types with zero framework dependencies. They describe
 * the raw data the engines consume (returned by the repository) and the JSON
 * shapes the engines produce (returned to the UI / API layer).
 */

/** Raw goal row (subset of Prisma `Goal` model, fully resolved by the repository). */
export interface SmartGoalRecord {
  id: string;
  workspaceId: string;
  ownerId: string;
  title: string;
  specific: string | null;
  measurable: string | null;
  achievable: string | null;
  relevant: string | null;
  deadline: Date | null;
  status: string; // active | completed | archived
  createdAt: Date;
}

export interface SmartMilestoneRecord {
  id: string;
  title: string;
  status: string; // pending | completed
  dueDate: Date | null;
  createdAt: Date;
}

export interface SmartTaskRecord {
  id: string;
  title: string;
  status: string; // open | done
  userId: string;
  load: string; // Light | Medium | Heavy
  estimatedMinutes: number | null;
  priority: number | null; // 1-5
  createdAt: Date;
  completedAt: Date | null;
}

export interface SmartMemberRecord {
  userId: string;
  name: string;
}

/** Aggregated raw snapshot the repository hands to the engines. */
export interface SmartGoalSnapshot {
  goal: SmartGoalRecord;
  milestones: SmartMilestoneRecord[];
  tasks: SmartTaskRecord[];
  members: SmartMemberRecord[];
}

/* ------------------------------------------------------------------ */
/* Output shapes (what the engines compute)                           */
/* ------------------------------------------------------------------ */

export type ProgressStatus =
  | "On Track"
  | "Ahead"
  | "Behind Schedule"
  | "At Risk"
  | "Completed"
  | "Not Started";

export interface GoalProgress {
  goalProgress: number; // 0..100 real completion
  expectedProgress: number; // 0..100 expected by now (time-elapsed)
  pending: number; // 100 - goalProgress
  status: ProgressStatus;
  velocity: number; // completed weight points / week
  pace: "Slow" | "Steady" | "Fast";
}

export interface Contribution {
  userId: string;
  name: string;
  share: number; // 0..100 share of total progress
  contributionScore: number; // 0..100
  deliveryScore: number; // 0..100
  qualityScore: number; // 0..100
  collaborationScore: number; // 0..100
  reliabilityScore: number; // 0..100
  color: string; // hex layer color for the cylinder
}

export interface ContributionReport {
  members: Contribution[];
  teamShare: number; // share not attributable to a single person
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RiskSignal {
  id: string;
  level: RiskLevel;
  type:
    | "behind_schedule"
    | "deadline_close"
    | "overload"
    | "blocked"
    | "stalled"
    | "no_milestones";
  title: string;
  detail: string;
  userId?: string;
}

export interface Prediction {
  completionProbability: number; // 0..100
  estimatedFinishDate: string | null; // ISO date
  riskLevel: RiskLevel;
  daysEarlyOrLate: number; // negative = early, positive = late
}

export interface HealthReport {
  healthScore: number; // 0..100
  deliveryConfidence: number; // 0..100
  burnRate: number; // completed weight / total weight over elapsed time
  teamEfficiency: number; // 0..100
  goalAlignment: number; // 0..100 (SMART completeness)
}

export interface TimelineEvent {
  id: string;
  date: string; // ISO
  type: "milestone" | "task_done" | "risk" | "goal_created" | "deadline";
  title: string;
  responsible: string | null;
  impact: "high" | "medium" | "low";
}

export interface Insight {
  id: string;
  kind: "gap" | "concentration" | "risk" | "recommendation" | "win";
  text: string;
}

export interface SmartValidation {
  isSmart: boolean;
  score: number; // 0..100
  checks: Array<{ key: string; label: string; passed: boolean; hint?: string }>;
}

/** Full composite report returned by `computeGoalProgress`. */
export interface GoalProgressReport {
  goalId: string;
  goalTitle: string;
  computedAt: string;
  progress: GoalProgress;
  contributions: ContributionReport;
  risks: RiskSignal[];
  prediction: Prediction;
  health: HealthReport;
  timeline: TimelineEvent[];
  insights: Insight[];
  usedGemini: boolean;
}
