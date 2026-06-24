import { NextResponse } from "next/server";
import { requireProjectLeader } from "@/server/lib/requireProjectLeader";
import { jsonError, parseRequestBody, toFriendlyMessage } from "@/server/lib/apiErrors";
import { getProjectSettingsDeps } from "@/features/project-settings/infrastructure/container";
import { InviteMember } from "@/features/project-settings/application/use-cases/ManageMembers";
import { inviteSchema } from "@/features/project-settings/application/schemas";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireProjectLeader((await params).id);
    if (auth.response) return auth.response;
    const deps = getProjectSettingsDeps();
    const [members, invitations] = await Promise.all([
      deps.memberRepository.list(auth.workspaceId!),
      deps.memberRepository.listInvitations(auth.workspaceId!),
    ]);
    return NextResponse.json({ members, invitations });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireProjectLeader((await params).id);
    if (auth.response) return auth.response;

    const parsed = inviteSchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json({ error: toFriendlyMessage(parsed.error) }, { status: 400 });
    }

    const deps = getProjectSettingsDeps();
    const useCase = new InviteMember(deps);
    const invitation = await useCase.execute(
      auth.workspaceId!,
      auth.user.id,
      parsed.data
    );
    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
