import { z } from "zod";
import type { ITeamInsightsRepository } from "../../domain/repositories/ITeamInsightsRepository";
import { assembleCore } from "../analytics";
import { buildSkillGaps } from "../../domain/scoring/skills";

export const exportReportSchema = z.object({
  workspaceId: z.string().min(1),
  format: z.enum(["csv", "json"]).default("csv"),
  scope: z
    .enum(["team", "productivity", "learning", "wellbeing", "risks"])
    .default("team"),
  days: z.number().int().min(7).max(365).optional().default(90),
});

export type ExportReportInput = z.infer<typeof exportReportSchema>;

export interface ExportResult {
  format: "csv" | "json";
  filename: string;
  mime: string;
  content: string;
}

export class ExportReport {
  constructor(private readonly repo: ITeamInsightsRepository) {}

  async execute(input: ExportReportInput): Promise<ExportResult> {
    const until = new Date();
    const since = new Date(until.getTime() - input.days * 86400000);
    const stamp = since.toISOString().slice(0, 10) + "_" + until.toISOString().slice(0, 10);

    const core = await assembleCore(this.repo, input.workspaceId, undefined, {
      since,
      until,
    });
    const [skills, learning] = await Promise.all([
      this.repo.listSkills(input.workspaceId),
      this.repo.listLearning(input.workspaceId, since),
    ]);
    const skillGaps = buildSkillGaps(skills, core.members.length);

    const payload = {
      scope: input.scope,
      since: since.toISOString(),
      until: until.toISOString(),
      team: {
        headcount: core.members.length,
        psychologicalSafety: core.safety,
        productivityRisk: core.risk,
        workload: core.workload,
        learningKpis: core.learningKpis,
        skillGaps,
      },
      members: core.members.map((m) => ({
        id: m.id,
        name: m.name,
        position: m.position,
        seniority: m.seniority,
        activeTasks: m.activeTasks,
        completedTasks: m.completedTasks,
        workedHours: m.workedHours,
        progressPct: m.progressPct,
        learningProgress: m.learningProgress,
        sentimentScore: m.sentimentScore,
        sentiment: m.sentiment,
      })),
      learning,
    };

    const filename = `team-insights-${input.scope}-${stamp}.${input.format}`;
    const mime = input.format === "csv" ? "text/csv" : "application/json";

    const content =
      input.format === "csv"
        ? toCsv(payload, input.scope)
        : JSON.stringify(payload, null, 2);

    return { format: input.format, filename, mime, content };
  }
}

function toCsv(payload: Record<string, unknown>, scope: string): string {
  const rows: string[] = [];
  const pushRow = (cells: (string | number)[]) =>
    rows.push(cells.map(csvCell).join(","));

  if (scope === "team" || scope === "productivity" || scope === "wellbeing" || scope === "risks") {
    pushRow([
      "name",
      "position",
      "seniority",
      "activeTasks",
      "completedTasks",
      "workedHours",
      "progressPct",
      "learningProgress",
      "sentimentScore",
      "sentiment",
    ]);
    for (const m of payload.members as Record<string, unknown>[]) {
      pushRow([
        m.name as string,
        (m.position as string) ?? "",
        (m.seniority as string) ?? "",
        m.activeTasks as number,
        m.completedTasks as number,
        m.workedHours as number,
        m.progressPct as number,
        m.learningProgress as number,
        m.sentimentScore as number,
        m.sentiment as string,
      ]);
    }
  }
  if (scope === "learning") {
    pushRow(["employeeId", "type", "title", "skill", "level", "hours", "completedAt"]);
    for (const l of payload.learning as Record<string, unknown>[]) {
      pushRow([
        l.employeeId as string,
        l.type as string,
        l.title as string,
        (l.skill as string) ?? "",
        (l.level as string) ?? "",
        l.hours as number,
        (l.completedAt as string) ?? "",
      ]);
    }
  }
  return rows.join("\n");
}

function csvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
