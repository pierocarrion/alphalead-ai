export type EmotionalState = "positive" | "neutral" | "risk";
export type Seniority = "junior" | "mid" | "senior" | "lead" | string;

export interface Employee {
  id: string;
  name: string;
  photo: string | null;
  position: string | null;
  team: string;
  role: string;
  seniority: Seniority | null;
  hireDate: Date | null;
}

export interface EmployeeMetrics {
  employeeId: string;
  activeTasks: number;
  completedTasks: number;
  workedHours: number;
  estimatedHours: number;
  progressPct: number;
  learningProgress: number;
  sentimentScore: number;
  sentiment: EmotionalState;
  /** False when sentiment was derived without any survey/feedback data. */
  sentimentHasData: boolean;
}

export interface EmployeeWithMetrics extends Employee, EmployeeMetrics {}
