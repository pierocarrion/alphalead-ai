import { NextResponse } from "next/server";
import { requireUser } from "@/server/lib/auth";
import { getActiveWorkspace } from "@/server/lib/activeWorkspace";
import { jsonError } from "@/server/lib/apiErrors";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { active, memberships } = await getActiveWorkspace(auth.user.id);

    return NextResponse.json({
      activeWorkspaceId: active?.workspaceId ?? null,
      workspaces: memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        emoji: m.workspace.emoji,
        hashtag: m.workspace.hashtag,
        role: m.role,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
