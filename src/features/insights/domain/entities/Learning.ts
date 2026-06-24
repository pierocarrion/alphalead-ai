import type { RiskLevel } from "./ProductivityRisk";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type LearningType =
  | "course"
  | "certification"
  | "workshop"
  | "reading"
  | string;

export interface LearningActivity {
  id: string;
  employeeId: string;
  type: LearningType;
  title: string;
  skill: string | null;
  level: SkillLevel | null;
  hours: number;
  completedAt: Date | null;
  createdAt: Date;
}

export interface SkillCell {
  employeeId: string;
  employeeName: string;
  skill: string;
  level: SkillLevel;
}

export interface SkillGap {
  skill: string;
  holders: number;
  experts: number;
  riskLevel: RiskLevel;
  recommendation: string;
}

export interface LearningProgressKpis {
  coursesStarted: number;
  coursesCompleted: number;
  learningHours: number;
  certifications: number;
}

export interface LearningEvolutionPoint {
  date: string;
  started: number;
  completed: number;
  hours: number;
  skills: number;
}
