import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/lib/auth";
import { container } from "@/server/lib/container";
import { jsonError, parseRequestBody, toFriendlyMessage } from "@/server/lib/apiErrors";

const createCategorySchema = z.object({
  key: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/, "La clave debe usar minúsculas y guiones."),
  name: z.string().min(1).max(60),
  color: z.string().max(20).optional(),
  icon: z.string().max(40).optional(),
});

export async function GET(
  _request: Request,
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
    const categories = await container.knowledgeRepository.listCategories(id);
    return NextResponse.json({ categories });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { id } = await params;
    const isLeader = await container.projectRepository.isLeader(auth.user.id, id);
    if (!isLeader) {
      return NextResponse.json({ error: "Solo el líder puede crear categorías." }, { status: 403 });
    }
    const parsed = createCategorySchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json({ error: toFriendlyMessage(parsed.error) }, { status: 400 });
    }
    const category = await container.knowledgeRepository.createCategory({
      workspaceId: id,
      key: parsed.data.key,
      name: parsed.data.name,
      color: parsed.data.color,
      icon: parsed.data.icon,
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
