import { kpiConfigSchema, type KpiConfigInput } from "../schemas";
import type { IKpiRepository, IAuditRepository } from "../../domain/repositories";
import type { ProjectKpi } from "../../domain/entities";

export interface ConfigureKpisDeps {
  kpiRepository: IKpiRepository;
  auditRepository: IAuditRepository;
}

export interface ConfigureKpisRequest extends KpiConfigInput {
  workspaceId: string;
  actorId: string;
}

export class ConfigureKpis {
  constructor(private readonly deps: ConfigureKpisDeps) {}

  async execute(request: ConfigureKpisRequest): Promise<ProjectKpi[]> {
    const parsed = kpiConfigSchema.parse({ entries: request.entries });

    const before = await this.deps.kpiRepository.list(request.workspaceId);
    const after = await this.deps.kpiRepository.set(request.workspaceId, parsed.entries);

    await this.deps.auditRepository.record({
      workspaceId: request.workspaceId,
      actorId: request.actorId,
      action: "kpi.configure",
      entity: "kpi",
      before: before.map((k) => ({ kpiKey: k.kpiKey, enabled: k.enabled })),
      after: after.map((k) => ({ kpiKey: k.kpiKey, enabled: k.enabled })),
    });

    return after;
  }
}
