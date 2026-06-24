import { KPI_CATALOG } from "../../domain/catalog";
import type { SmartGoal } from "../../domain/entities";
import type {
  IAiInsightRepository,
  IAuditRepository,
  IKpiRepository,
  IMemberRepository,
  IMethodologyRepository,
  ISmartGoalRepository,
} from "../../domain/repositories";
import {
  generateProjectInsights,
  type AiInsightBundle,
  type GeneratedInsight,
} from "@/server/lib/projectSettingsAi";
import { UserFacingError } from "@/server/lib/errors";

export interface GenerateAiInsightsDeps {
  smartGoalRepository: ISmartGoalRepository;
  methodologyRepository: IMethodologyRepository;
  memberRepository: IMemberRepository;
  kpiRepository: IKpiRepository;
  aiInsightRepository: IAiInsightRepository;
  auditRepository: IAuditRepository;
  generate: typeof generateProjectInsights;
}

export class GenerateAiInsights {
  constructor(private readonly deps: GenerateAiInsightsDeps) {}

  async execute(
    workspaceId: string,
    projectName: string,
    actorId: string
  ): Promise<AiInsightBundle> {
    const [goal, methodologies, members, kpis] = await Promise.all([
      this.deps.smartGoalRepository.get(workspaceId),
      this.deps.methodologyRepository.list(workspaceId),
      this.deps.memberRepository.list(workspaceId),
      this.deps.kpiRepository.list(workspaceId),
    ]);

    const primary = methodologies.find((m) => m.tier === "primary")?.methodologyKey ?? null;
    const secondary = methodologies
      .filter((m) => m.tier === "secondary")
      .map((m) => m.methodologyKey);

    const activeKpiKeys = kpis.filter((k) => k.enabled).map((k) => k.kpiKey);
    const activeKpis = KPI_CATALOG.filter((k) => activeKpiKeys.includes(k.key));

    const result = await this.deps.generate({
      projectName,
      goal: goal as SmartGoal | null,
      primaryMethodology: primary,
      secondaryMethodologies: secondary,
      members: members.map((m) => ({ name: m.name, projectRole: m.projectRole })),
      activeKpis,
    });

    if (!result.ok || !result.data) {
      throw new UserFacingError(result.error ?? "No pudimos generar insights en este momento.", 503);
    }

    const bundle = result.data;
    const insights: GeneratedInsight[] = [
      ...bundle.risks,
      ...bundle.recommendations,
      ...bundle.alerts,
    ];

    await this.deps.aiInsightRepository.replace(workspaceId, insights);
    await this.deps.auditRepository.record({
      workspaceId,
      actorId,
      action: "insight.generate",
      entity: "insight",
      after: { count: insights.length },
    });

    return bundle;
  }
}
