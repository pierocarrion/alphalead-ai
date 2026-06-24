export type InsightCategory =
  | "workload"
  | "learning"
  | "wellbeing"
  | "growth"
  | "skills"
  | "productivity";

export type InsightTone = "celebration" | "opportunity" | "caution";

export interface TeamInsight {
  id: string;
  category: InsightCategory;
  tone: InsightTone;
  title: string;
  detail: string;
  subject?: { kind: "employee" | "team" | "skill"; ref: string };
}
