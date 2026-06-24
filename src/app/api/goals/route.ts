import { NextResponse } from "next/server";
import { requireUser } from "@/server/lib/auth";
import { container } from "@/server/lib/container";
import { jsonError, parseRequestBody } from "@/server/lib/apiErrors";
import { getActiveWorkspace } from "@/server/lib/activeWorkspace";
import {
  createSmartGoalSchema,
  CreateSmartGoal,
} from "@/features/projects/application/use-cases/ManageSmartGoal";

const createGoal = new CreateSmartGoal(
  container.goalProgressRepository,
  container.projectRepository
);

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { active } = await getActiveWorkspace(auth.user.id);
    if (!active) {
      return NextResponse.json({ goals: [] });
    }
    const goals = await container.goalProgressRepository.listForWorkspace(
      active.workspaceId
    );
    return NextResponse.json({ goals });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const body = (await parseRequestBody(request)) as Record<string, unknown>;
    const { active } = await getActiveWorkspace(auth.user.id);
    const workspaceId = (body.workspaceId as string) ?? active?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Elige un proyecto activo." },
        { status: 400 }
      );
    }

    const parsed = createSmartGoalSchema.safeParse({
      ...body,
      userId: auth.user.id,
      workspaceId,
    });
    if (!parsed.success) return jsonError(parsed.error);

    const goal = await createGoal.execute(parsed.data);
    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
