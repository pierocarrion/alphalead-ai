import { NextResponse } from "next/server";
import { requireProjectLeader } from "@/server/lib/requireProjectLeader";
import { jsonError, parseRequestBody, toFriendlyMessage } from "@/server/lib/apiErrors";
import { getProjectSettingsDeps } from "@/features/project-settings/infrastructure/container";
import { RemoveMember, UpdateMember } from "@/features/project-settings/application/use-cases/ManageMembers";
import { memberUpdateSchema } from "@/features/project-settings/application/schemas";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    const auth = await requireProjectLeader(id);
    if (auth.response) return auth.response;

    const parsed = memberUpdateSchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json({ error: toFriendlyMessage(parsed.error) }, { status: 400 });
    }

    const deps = getProjectSettingsDeps();
    const useCase = new UpdateMember(deps);
    const member = await useCase.execute(auth.workspaceId!, memberId, auth.user.id, parsed.data);
    return NextResponse.json({ member });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    const auth = await requireProjectLeader(id);
    if (auth.response) return auth.response;

    const deps = getProjectSettingsDeps();
    const useCase = new RemoveMember(deps);
    await useCase.execute(auth.workspaceId!, memberId, auth.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
