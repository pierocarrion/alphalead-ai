import { NextResponse } from "next/server";
import { requireUser } from "@/server/lib/auth";
import { container } from "@/server/lib/container";
import { jsonError } from "@/server/lib/apiErrors";
import { GetGoalProgress } from "@/features/projects/application/use-cases/GetGoalProgress";
import { generateGoalInsights } from "@/server/lib/goalInsight";

const getProgress = new GetGoalProgress(
  container.goalProgressRepository,
  container.projectRepository
);

/**
 * GET /api/goals/:id/progress
 * Runs the full AI Progress Engine against the goal and (optionally) enriches
 * the insights with Gemini. The deterministic report is always returned even
 * when Gemini is disabled — matching the codebase "fallback to heuristics" rule.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { id } = await params;

    const report = await getProgress.execute(id, auth.user.id);
    const insightResult = await generateGoalInsights(report);

    return NextResponse.json({
      ...report,
      insights: insightResult.insights,
      usedGemini: insightResult.usedGemini,
    });
  } catch (error) {
    return jsonError(error);
  }
}
