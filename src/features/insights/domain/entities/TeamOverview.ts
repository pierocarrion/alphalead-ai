import type { EmployeeWithMetrics } from "./Employee";
import type { WorkloadBalance } from "./Workload";
import type { PsychologicalSafety } from "./PsychologicalSafety";
import type { ProductivityRisk } from "./ProductivityRisk";
import type { TeamGrowth } from "./TeamGrowth";
import type { LearningProgressKpis, SkillCell, SkillGap } from "./Learning";
import type { TeamAlert } from "./Alert";
import type { TeamInsight } from "./Insight";

export interface TeamOverview {
  teamName: string;
  headcount: number;
  workload: WorkloadBalance;
  psychologicalSafety: PsychologicalSafety;
  productivityRisk: ProductivityRisk;
  growth: TeamGrowth;
  learningKpis: LearningProgressKpis;
  skillsMatrix: SkillCell[];
  skillGaps: SkillGap[];
  alerts: TeamAlert[];
  insights: TeamInsight[];
  members: EmployeeWithMetrics[];
}

export interface ColleagueDetail {
  employee: EmployeeWithMetrics;
  recentActivity: {
    date: string;
    kind: "course" | "certification" | "task" | "meeting" | "feedback";
    title: string;
    detail?: string;
  }[];
  learningEvolution: {
    date: string;
    started: number;
    completed: number;
    hours: number;
    skills: number;
  }[];
  productivityEvolution: {
    week: string;
    completed: number;
    leadTimeDays: number;
    cycleTimeDays: number;
    avgDeliveryDays: number;
  }[];
  wellbeingHistory: {
    date: string;
    sentiment: string;
    satisfaction: number;
    participation: number;
  }[];
}

export interface TeamInsightsFilters {
  team?: string;
  project?: string;
  position?: string;
  seniority?: string;
  since?: string;
  until?: string;
  sentiment?: string;
  risk?: string;
  skills?: string[];
}

export interface GrowthWindow {
  granularity: "week" | "month" | "quarter" | "year";
  since: Date;
  until: Date;
}
