import { NextResponse } from "next/server";
import { prisma } from "@/server/lib/prisma";
import { requireProjectLeader } from "@/server/lib/requireProjectLeader";
import { jsonError } from "@/server/lib/apiErrors";
import { getProjectSettingsDeps } from "@/features/project-settings/infrastructure/container";
import { GenerateAiInsights } from "@/features/project-settings/application/use-cases/GenerateAiInsights";
import { generateProjectInsights } from "@/server/lib/projectSettingsAi";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireProjectLeader((await params).id);
    if (auth.response) return auth.response;
    const deps = getProjectSettingsDeps();
    const insights = await deps.aiInsightRepository.list(auth.workspaceId!);
    return NextResponse.json({ insights });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireProjectLeader((await params).id);
    if (auth.response) return auth.response;

    const workspace = await prisma.workspace.findUnique({
      where: { id: auth.workspaceId! },
      select: { name: true },
    });

    const deps = getProjectSettingsDeps();
    const useCase = new GenerateAiInsights({ ...deps, generate: generateProjectInsights });
    const bundle = await useCase.execute(
      auth.workspaceId!,
      workspace?.name ?? "el proyecto",
      auth.user.id
    );
    const insights = await deps.aiInsightRepository.list(auth.workspaceId!);
    return NextResponse.json({ bundle, insights });
  } catch (error) {
    return jsonError(error);
  }
}
