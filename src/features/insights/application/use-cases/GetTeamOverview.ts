import { z } from "zod";
import type { ITeamInsightsRepository } from "../../domain/repositories/ITeamInsightsRepository";
import type { TeamOverview } from "../../domain/entities/TeamOverview";
import type { GrowthGranularity } from "../../domain/entities/TeamGrowth";
import { assembleCore } from "../analytics";
import { detectAlerts } from "../../domain/scoring/alerts";
import { generateInsights } from "../../domain/scoring/recommendations";
import { buildSkillGaps } from "../../domain/scoring/skills";
import { computeGrowth } from "../growth";
import { teamInsightsFiltersSchema } from "../schemas";

export const getTeamOverviewSchema = z.object({
  workspaceId: z.string().min(1),
  granularity: z
    .enum(["week", "month", "quarter", "year"])
    .optional()
    .default("month"),
  days: z.number().int().min(7).max(365).optional().default(90),
  filters: teamInsightsFiltersSchema,
});

export type GetTeamOverviewInput = z.infer<typeof getTeamOverviewSchema>;

export class GetTeamOverview {
  constructor(private readonly repo: ITeamInsightsRepository) {}

  async execute(input: GetTeamOverviewInput): Promise<TeamOverview> {
    const until = new Date();
    const since = new Date(until.getTime() - input.days * 86400000);
    const granularity: GrowthGranularity = input.granularity;

    const core = await assembleCore(
      this.repo,
      input.workspaceId,
      input.filters,
      { since, until }
    );

    const [skills, learning, teamName] = await Promise.all([
      this.repo.listSkills(input.workspaceId),
      this.repo.listLearning(input.workspaceId, since),
      this.repo.getTeamName(input.workspaceId),
    ]);

    const skillGaps = buildSkillGaps(skills, core.members.length);
    const growth = await computeGrowth(
      this.repo,
      input.workspaceId,
      granularity,
      since,
      until
    );

    const alerts = detectAlerts({
      members: core.members,
      workload: core.workload.points,
      safety: core.safety,
      risk: core.risk,
      learning,
      now: until,
    });

    const insights = generateInsights({
      members: core.members,
      workload: core.workload.points,
      learning,
      skills,
      skillGaps,
      safetyScore: core.safety.score,
      safetyHasData: core.safety.hasData,
      riskScore: core.risk.score,
      sinceDays: input.days,
    });

    return {
      teamName,
      headcount: core.members.length,
      workload: core.workload,
      psychologicalSafety: core.safety,
      productivityRisk: core.risk,
      growth,
      learningKpis: core.learningKpis,
      skillsMatrix: skills,
      skillGaps,
      alerts,
      insights,
      members: core.members,
    };
  }
}
