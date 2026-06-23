import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/lib/auth";
import { container } from "@/server/lib/container";
import { jsonError, parseRequestBody, toFriendlyMessage } from "@/server/lib/apiErrors";

const createItemSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(8000),
  sourceUrl: z.string().max(500).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { id } = await params;
    const isLeader = await container.projectRepository.isLeader(
      auth.user.id,
      id
    );
    if (!isLeader) {
      return NextResponse.json(
        { error: "Solo el líder del proyecto puede gestionar la base de conocimiento." },
        { status: 403 }
      );
    }

    const items = await container.projectRepository.listKnowledge(id);
    return NextResponse.json({ items });
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
    const isLeader = await container.projectRepository.isLeader(
      auth.user.id,
      id
    );
    if (!isLeader) {
      return NextResponse.json(
        { error: "Solo el líder del proyecto puede añadir entradas." },
        { status: 403 }
      );
    }

    const parsed = createItemSchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: toFriendlyMessage(parsed.error) },
        { status: 400 }
      );
    }

    const item = await container.projectRepository.addKnowledge(id, {
      title: parsed.data.title,
      content: parsed.data.content,
      sourceUrl: parsed.data.sourceUrl,
    });

    return NextResponse.json({ item });
  } catch (error) {
    return jsonError(error);
  }
}