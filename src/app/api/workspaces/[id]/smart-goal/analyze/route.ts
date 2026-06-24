import { NextResponse } from "next/server";
import { requireProjectLeader } from "@/server/lib/requireProjectLeader";
import { jsonError } from "@/server/lib/apiErrors";
import { getProjectSettingsDeps } from "@/features/project-settings/infrastructure/container";
import { analyzeSmartGoalWithAi } from "@/server/lib/projectSettingsAi";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireProjectLeader((await params).id);
    if (auth.response) return auth.response;

    const deps = getProjectSettingsDeps();
    const goal = await deps.smartGoalRepository.get(auth.workspaceId!);
    if (!goal) {
      return NextResponse.json(
        { error: "Guarda primero un objetivo SMART para analizarlo." },
        { status: 400 }
      );
    }

    const result = await analyzeSmartGoalWithAi(goal);
    if (!result.ok || !result.data) {
      return NextResponse.json({ error: result.error }, { status: 503 });
    }
    return NextResponse.json({ analysis: result.data });
  } catch (error) {
    return jsonError(error);
  }
}
