import { NextResponse } from "next/server";
import { requireUser } from "@/server/lib/auth";
import { getActiveWorkspace } from "@/server/lib/activeWorkspace";
import { jsonError } from "@/server/lib/apiErrors";

export interface ResolvedContext {
  workspaceId: string;
  userId: string;
  role: string;
}

export async function resolveTeamContext(): Promise<
  | { ok: true; context: ResolvedContext }
  | { ok: false; response: NextResponse }
> {
  const auth = await requireUser();
  if (auth.response) return { ok: false, response: auth.response };

  const { active } = await getActiveWorkspace(auth.user.id);
  if (!active) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Aún no perteneces a un equipo." },
        { status: 404 }
      ),
    };
  }

  return {
    ok: true,
    context: {
      workspaceId: active.workspaceId,
      userId: auth.user.id,
      role: active.role,
    },
  };
}

export { jsonError };
