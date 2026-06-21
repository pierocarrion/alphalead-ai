import { DetectedTaskDraft } from "@/features/tasks/lib/detect";

export interface AgentEvent {
  type: "message_sent" | "task_created" | "ritual_completed" | "daily_check" | "pair_request";
  userId: string;
  workspaceId: string;
  payload: Record<string, unknown>;
}

export interface AgentAction {
  agent: string;
  type: string;
  summary: string;
  data?: Record<string, unknown>;
}

export interface AgentResult {
  actions: AgentAction[];
  log: string[];
}

export interface TaskDetectionInput {
  text: string;
  channelId: string;
  fromUserId?: string;
}

export interface TaskDetectionOutput {
  detected: DetectedTaskDraft | null;
  action: AgentAction | null;
}

export interface HealthSignal {
  type: "load_imbalance" | "deadline_risk" | "mood_dip" | "procrastination_spike" | "recovery_win";
  severity: "low" | "medium" | "high";
  summary: string;
  userId?: string;
  suggestedAction?: string;
}

export interface WorkspaceHealthReport {
  workspaceId: string;
  generatedAt: Date;
  signals: HealthSignal[];
  teamMood: { value: number; label: string };
  recoveredMinutes: number;
}
