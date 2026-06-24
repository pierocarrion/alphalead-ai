import { GetTeamOverview, getTeamOverviewSchema } from "@/features/insights/application/use-cases/GetTeamOverview";
import { container } from "@/server/lib/container";
import { resolveTeamContext, jsonError } from "@/features/insights/infrastructure/http/resolveTeamContext";

const useCase = new GetTeamOverview(container.teamInsightsRepository);

export async function GET(request: Request) {
  try {
    const ctx = await resolveTeamContext();
    if (!ctx.ok) return ctx.response;

    const url = new URL(request.url);
    const parsed = getTeamOverviewSchema.safeParse({
      workspaceId: ctx.context.workspaceId,
      granularity: url.searchParams.get("granularity") ?? "month",
      days: url.searchParams.get("days")
        ? Number(url.searchParams.get("days"))
        : 90,
      filters: {
        seniority: url.searchParams.get("seniority") ?? undefined,
        position: url.searchParams.get("position") ?? undefined,
        sentiment: url.searchParams.get("sentiment") ?? undefined,
        risk: url.searchParams.get("risk") ?? undefined,
        since: url.searchParams.get("since") ?? undefined,
        until: url.searchParams.get("until") ?? undefined,
      },
    });
    if (!parsed.success) return jsonError(parsed.error);

    const overview = await useCase.execute(parsed.data);
    return Response.json(overview);
  } catch (error) {
    return jsonError(error);
  }
}
