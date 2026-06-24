export type RiskLevel = "low" | "moderate" | "high";

export interface RiskTrendPoint {
  date: string;
  score: number;
}

export interface ProductivityRisk {
  score: number;
  level: RiskLevel;
  trend: RiskTrendPoint[];
  breakdown: {
    overload: number;
    overdue: number;
    activityDecline: number;
    lowParticipation: number;
    taskMiss: number;
    absenteeism: number;
  };
}
