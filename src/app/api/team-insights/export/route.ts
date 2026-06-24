import { ExportReport, exportReportSchema } from "@/features/insights/application/use-cases/ExportReport";
import { container } from "@/server/lib/container";
import { resolveTeamContext, jsonError } from "@/features/insights/infrastructure/http/resolveTeamContext";

const useCase = new ExportReport(container.teamInsightsRepository);

export async function GET(request: Request) {
  try {
    const ctx = await resolveTeamContext();
    if (!ctx.ok) return ctx.response;

    const url = new URL(request.url);
    const parsed = exportReportSchema.safeParse({
      workspaceId: ctx.context.workspaceId,
      format: (url.searchParams.get("format") ?? "csv") as "csv" | "json",
      scope: (url.searchParams.get("scope") ?? "team") as
        | "team"
        | "productivity"
        | "learning"
        | "wellbeing"
        | "risks",
      days: url.searchParams.get("days")
        ? Number(url.searchParams.get("days"))
        : 90,
    });
    if (!parsed.success) return jsonError(parsed.error);

    const result = await useCase.execute(parsed.data);
    return new Response(result.content, {
      headers: {
        "Content-Type": result.mime,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
