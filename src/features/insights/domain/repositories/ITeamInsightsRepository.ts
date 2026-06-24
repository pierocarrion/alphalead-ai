import type { TeamInsightsFilters } from "../../domain/entities/TeamOverview";
import type { EmployeeWithMetrics } from "../../domain/entities/Employee";
import type { LearningActivity, SkillCell } from "../../domain/entities/Learning";

export interface RawFeedbackRow {
  userId: string | null;
  score: number | null;
  metricValue: number | null;
  type: string;
  createdAt: Date;
}
export interface RawSurveyRow {
  userId: string;
  psychologicalSafety: number;
  sentiment: string;
  createdAt: Date;
}
export interface RawCheckInRow {
  userId: string;
  date: Date;
  mood: string | null;
  energy: number | null;
}
export interface RawTaskRow {
  id: string;
  userId: string;
  status: string;
  estimatedMinutes: number | null;
  workedMinutes: number | null;
  createdAt: Date;
  completedAt: Date | null;
  deadline: Date | null;
}

export interface EmployeeActivityRow {
  id: string;
  type: "course" | "certification" | "task" | "meeting" | "feedback";
  title: string;
  detail: string | null;
  occurredAt: Date;
}

export interface ColleagueTimeseriesRow {
  bucket: string;
  started: number;
  completed: number;
  hours: number;
  skills: number;
}

export interface ITeamInsightsRepository {
  listMembers(
    workspaceId: string,
    filters?: TeamInsightsFilters
  ): Promise<EmployeeWithMetrics[]>;
  listTasks(workspaceId: string, since?: Date): Promise<RawTaskRow[]>;
  listFeedback(workspaceId: string, since?: Date): Promise<RawFeedbackRow[]>;
  listSurveys(workspaceId: string, since?: Date): Promise<RawSurveyRow[]>;
  listCheckIns(workspaceId: string, since?: Date): Promise<RawCheckInRow[]>;
  listLearning(
    workspaceId: string,
    since?: Date
  ): Promise<LearningActivity[]>;
  listSkills(workspaceId: string): Promise<SkillCell[]>;
  listMeetingsAttended(workspaceId: string, since?: Date): Promise<RawCheckInRow[]>;
  countMeetingsTotal(workspaceId: string, since?: Date): Promise<number>;
  listEmployeeActivity(
    workspaceId: string,
    employeeId: string,
    limit?: number
  ): Promise<EmployeeActivityRow[]>;
  getTeamName(workspaceId: string): Promise<string>;
}
