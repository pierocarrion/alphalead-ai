export type SafetyStatus = "critical" | "moderate" | "healthy";

export interface SafetyTrendPoint {
  date: string;
  score: number;
}

export interface PsychologicalSafety {
  score: number;
  status: SafetyStatus;
  /** False when there is no survey/feedback data to compute a real score. */
  hasData: boolean;
  trend: SafetyTrendPoint[];
  breakdown: {
    survey: number;
    feedback: number;
    participation: number;
    sentiment: number;
  };
}
