import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/lib/auth";
import { container } from "@/server/lib/container";
import { jsonError, parseRequestBody, toFriendlyMessage } from "@/server/lib/apiErrors";
import {
  AskGoalCopilot,
  askCopilotSchema,
} from "@/features/projects/application/use-cases/AskGoalCopilot";

const askCopilot = new AskGoalCopilot(
  container.goalProgressRepository,
  container.projectRepository
);

const bodySchema = z.object({
  question: z.string().min(1).max(500),
});

/**
 * POST /api/goals/:id/copilot
 * Answers a leader's natural-language question about a goal, grounded on its
 * computed progress report (RAG over the report). Falls back to a deterministic
 * summary when Gemini is unavailable.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { id } = await params;

    const body = (await parseRequestBody(request)) as Record<string, unknown>;
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: toFriendlyMessage(parsed.error) },
        { status: 400 }
      );
    }

    const result = await askCopilot.execute(
      askCopilotSchema.parse({
        goalId: id,
        userId: auth.user.id,
        question: parsed.data.question,
      })
    );
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
