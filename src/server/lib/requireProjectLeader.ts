import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { requireUser, type AuthUser } from "./auth";

const MSG_SIGN_IN = "Please sign in to continue.";
const MSG_FORBIDDEN =
  "No tienes permiso para gestionar la configuración de este proyecto.";
const MSG_NOT_FOUND = "No encontramos ese proyecto.";

export interface RequireLeaderResult {
  user: AuthUser;
  workspaceId: string;
  response: null;
}

export interface RequireLeaderErrorResponse {
  user: null;
  workspaceId: null;
  response: NextResponse;
}

/**
 * Ensures the caller is authenticated AND is a leader/admin of the project
 * identified by the route's `id` param. Returns the workspace id on success.
 */
export async function requireProjectLeader(
  rawProjectId: string
): Promise<RequireLeaderResult | RequireLeaderErrorResponse> {
  const auth = await requireUser();
  if (auth.response) {
    return { user: null, workspaceId: null, response: auth.response };
  }
  const user = auth.user;

  const projectId = decodeURIComponent(rawProjectId);
  const workspace = await prisma.workspace.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!workspace) {
    return {
      user: null,
      workspaceId: null,
      response: NextResponse.json({ error: MSG_NOT_FOUND }, { status: 404 }),
    };
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    select: { role: true },
  });

  if (!membership || (membership.role !== "leader" && membership.role !== "admin")) {
    return {
      user: null,
      workspaceId: null,
      response: NextResponse.json({ error: MSG_FORBIDDEN }, { status: 403 }),
    };
  }

  return { user, workspaceId: workspace.id, response: null };
}

export { MSG_SIGN_IN };
