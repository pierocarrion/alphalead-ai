export type SafetyStatus = "critical" | "moderate" | "healthy";

export interface SafetyTrendPoint {
  date: string;
  score: number;
}

export interface PsychologicalSafety {
  score: number;
  status: SafetyStatus;
  trend: SafetyTrendPoint[];
  breakdown: {
    survey: number;
    feedback: number;
    participation: number;
    sentiment: number;
  };
}
