import { NextResponse } from "next/server";
import { requireProjectLeader } from "@/server/lib/requireProjectLeader";
import { jsonError } from "@/server/lib/apiErrors";
import { getProjectSettingsDeps } from "@/features/project-settings/infrastructure/container";
import { KPI_CATALOG, METHODOLOGIES, PROJECT_ROLES } from "@/features/project-settings/domain/catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireProjectLeader((await params).id);
    if (auth.response) return auth.response;
    const workspaceId = auth.workspaceId!;

    const deps = getProjectSettingsDeps();
    const [smartGoal, methodologies, members, invitations, kpis, insights] = await Promise.all([
      deps.smartGoalRepository.get(workspaceId),
      deps.methodologyRepository.list(workspaceId),
      deps.memberRepository.list(workspaceId),
      deps.memberRepository.listInvitations(workspaceId),
      deps.kpiRepository.list(workspaceId),
      deps.aiInsightRepository.list(workspaceId),
    ]);

    return NextResponse.json({
      smartGoal,
      methodologies,
      members,
      invitations,
      kpis,
      insights,
      catalogs: {
        methodologies: METHODOLOGIES,
        roles: PROJECT_ROLES,
        kpis: KPI_CATALOG,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
