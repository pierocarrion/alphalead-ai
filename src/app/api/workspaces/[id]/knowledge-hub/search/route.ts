import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/lib/auth";
import { container } from "@/server/lib/container";
import { jsonError, parseRequestBody, toFriendlyMessage } from "@/server/lib/apiErrors";
import { knowledgeContainer } from "@/features/knowledge/infrastructure/knowledgeContainer";

const searchSchema = z.object({
  query: z.string().min(1).max(1000),
  topK: z.number().int().min(1).max(20).optional(),
  mode: z.enum(["hybrid", "semantic"]).optional(),
  categoryId: z.string().optional(),
  tag: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { id } = await params;

    const isMember = await container.projectRepository.isMember(auth.user.id, id);
    if (!isMember) {
      return NextResponse.json({ error: "No tienes acceso a este espacio." }, { status: 403 });
    }

    const parsed = searchSchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json({ error: toFriendlyMessage(parsed.error) }, { status: 400 });
    }

    const search = knowledgeContainer.searchKnowledge();
    const mode = parsed.data.mode ?? "hybrid";
    const common = {
      workspaceId: id,
      query: parsed.data.query,
      topK: parsed.data.topK ?? 8,
      filters: { categoryId: parsed.data.categoryId, tag: parsed.data.tag },
    };

    if (mode === "semantic") {
      const result = await search.semantic(common);
      return NextResponse.json({ mode, ...result });
    }
    const results = await search.hybrid(common);
    return NextResponse.json({ mode, query: parsed.data.query, results });
  } catch (error) {
    return jsonError(error);
  }
}
