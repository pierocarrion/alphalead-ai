import { GetLearningAnalytics, getLearningAnalyticsSchema } from "@/features/insights/application/use-cases/GetLearningAnalytics";
import { container } from "@/server/lib/container";
import { resolveTeamContext, jsonError } from "@/features/insights/infrastructure/http/resolveTeamContext";

const useCase = new GetLearningAnalytics(container.teamInsightsRepository);

export async function GET(request: Request) {
  try {
    const ctx = await resolveTeamContext();
    if (!ctx.ok) return ctx.response;

    const url = new URL(request.url);
    const parsed = getLearningAnalyticsSchema.safeParse({
      workspaceId: ctx.context.workspaceId,
      days: url.searchParams.get("days")
        ? Number(url.searchParams.get("days"))
        : 90,
    });
    if (!parsed.success) return jsonError(parsed.error);

    const result = await useCase.execute(parsed.data);
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
