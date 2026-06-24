import { GetColleagueDetail, getColleagueDetailSchema } from "@/features/insights/application/use-cases/GetColleagueDetail";
import { container } from "@/server/lib/container";
import { resolveTeamContext, jsonError } from "@/features/insights/infrastructure/http/resolveTeamContext";

const useCase = new GetColleagueDetail(container.teamInsightsRepository);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await resolveTeamContext();
    if (!ctx.ok) return ctx.response;
    const { id } = await params;

    const url = new URL(request.url);
    const parsed = getColleagueDetailSchema.safeParse({
      workspaceId: ctx.context.workspaceId,
      employeeId: id,
      days: url.searchParams.get("days")
        ? Number(url.searchParams.get("days"))
        : 90,
    });
    if (!parsed.success) return jsonError(parsed.error);

    const detail = await useCase.execute(parsed.data);
    return Response.json(detail);
  } catch (error) {
    return jsonError(error);
  }
}
