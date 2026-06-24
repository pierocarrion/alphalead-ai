import { NextResponse } from "next/server";
import { requireProjectLeader } from "@/server/lib/requireProjectLeader";
import { jsonError, parseRequestBody, toFriendlyMessage } from "@/server/lib/apiErrors";
import { getProjectSettingsDeps } from "@/features/project-settings/infrastructure/container";
import { SetMethodology } from "@/features/project-settings/application/use-cases/SetMethodology";
import { methodologySchema } from "@/features/project-settings/application/schemas";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireProjectLeader((await params).id);
    if (auth.response) return auth.response;
    const deps = getProjectSettingsDeps();
    const methodologies = await deps.methodologyRepository.list(auth.workspaceId!);
    return NextResponse.json({ methodologies });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireProjectLeader((await params).id);
    if (auth.response) return auth.response;

    const parsed = methodologySchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json({ error: toFriendlyMessage(parsed.error) }, { status: 400 });
    }

    const deps = getProjectSettingsDeps();
    const useCase = new SetMethodology(deps);
    const methodologies = await useCase.execute({
      ...parsed.data,
      workspaceId: auth.workspaceId!,
      actorId: auth.user.id,
    });
    return NextResponse.json({ methodologies });
  } catch (error) {
    return jsonError(error);
  }
}
