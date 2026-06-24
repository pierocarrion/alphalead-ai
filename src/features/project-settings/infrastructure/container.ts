import {
  PrismaAiInsightRepository,
  PrismaAuditRepository,
  PrismaKpiRepository,
  PrismaMemberRepository,
  PrismaMethodologyRepository,
  PrismaSmartGoalRepository,
} from "./repositories";
import type {
  IAiInsightRepository,
  IAuditRepository,
  IKpiRepository,
  IMemberRepository,
  IMethodologyRepository,
  ISmartGoalRepository,
} from "../domain/repositories";

export interface ProjectSettingsDeps {
  smartGoalRepository: ISmartGoalRepository;
  methodologyRepository: IMethodologyRepository;
  memberRepository: IMemberRepository;
  kpiRepository: IKpiRepository;
  aiInsightRepository: IAiInsightRepository;
  auditRepository: IAuditRepository;
}

export function createProjectSettingsDeps(): ProjectSettingsDeps {
  return {
    smartGoalRepository: new PrismaSmartGoalRepository(),
    methodologyRepository: new PrismaMethodologyRepository(),
    memberRepository: new PrismaMemberRepository(),
    kpiRepository: new PrismaKpiRepository(),
    aiInsightRepository: new PrismaAiInsightRepository(),
    auditRepository: new PrismaAuditRepository(),
  };
}

let cached: ProjectSettingsDeps | null = null;
export function getProjectSettingsDeps(): ProjectSettingsDeps {
  if (!cached) cached = createProjectSettingsDeps();
  return cached;
}

/** Test hook to reset the cached singleton between tests. */
export function __resetProjectSettingsDeps(): void {
  cached = null;
}
