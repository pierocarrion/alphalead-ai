import { NextResponse } from "next/server";
import { requireUser } from "@/server/lib/auth";
import { container } from "@/server/lib/container";
import { jsonError, parseRequestBody } from "@/server/lib/apiErrors";
import {
  updateSmartGoalSchema,
  UpdateSmartGoal,
} from "@/features/projects/application/use-cases/ManageSmartGoal";

const updateGoal = new UpdateSmartGoal(
  container.goalProgressRepository,
  container.projectRepository
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { id } = await params;
    const goal = await container.goalProgressRepository.findById(id);
    if (!goal) {
      return NextResponse.json(
        { error: "No encontramos ese objetivo." },
        { status: 404 }
      );
    }
    return NextResponse.json({ goal });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { id } = await params;
    const body = (await parseRequestBody(request)) as Record<string, unknown>;
    const parsed = updateSmartGoalSchema.safeParse({
      ...body,
      goalId: id,
      userId: auth.user.id,
    });
    if (!parsed.success) return jsonError(parsed.error);

    const goal = await updateGoal.execute(parsed.data);
    return NextResponse.json({ goal });
  } catch (error) {
    return jsonError(error);
  }
}
