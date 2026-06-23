import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/lib/auth";
import { container } from "@/server/lib/container";
import { jsonError, parseRequestBody, toFriendlyMessage } from "@/server/lib/apiErrors";

const bodySchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(600).optional(),
  industry: z.string().max(60).optional(),
  category: z.string().max(60).optional(),
  emoji: z.string().min(1).max(8).optional(),
  teamSize: z.string().max(20).optional(),
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
        { error: "Solo el líder del proyecto puede ver los ajustes." },
        { status: 403 }
      );
    }

    const project = await container.projectRepository.findById(id);
    if (!project) {
      return NextResponse.json(
        { error: "No encontramos ese proyecto." },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
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
    const isLeader = await container.projectRepository.isLeader(
      auth.user.id,
      id
    );
    if (!isLeader) {
      return NextResponse.json(
        { error: "Solo el líder del proyecto puede editar los ajustes." },
        { status: 403 }
      );
    }

    const parsed = bodySchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: toFriendlyMessage(parsed.error) },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const project = await container.projectRepository.update(id, {
      name: data.name,
      description: data.description,
      industry: data.industry,
      category: data.category,
      emoji: data.emoji,
      teamSize: data.teamSize,
    });

    return NextResponse.json({ project });
  } catch (error) {
    return jsonError(error);
  }
}
