import { NextResponse } from "next/server";
import { z } from "zod";
import { after } from "next/server";
import { requireUser } from "@/server/lib/auth";
import { container } from "@/server/lib/container";
import { jsonError, parseRequestBody, toFriendlyMessage } from "@/server/lib/apiErrors";
import { knowledgeContainer } from "@/features/knowledge/infrastructure/knowledgeContainer";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(1000).nullable().optional(),
  contentText: z.string().min(1).optional(),
  categoryId: z.string().nullable().optional(),
  accessLevel: z.enum(["workspace", "leaders", "members"]).optional(),
  isPremium: z.boolean().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  status: z.enum(["active", "processing", "archived"]).optional(),
  reingest: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { id, resourceId } = await params;
    const isMember = await container.projectRepository.isMember(auth.user.id, id);
    if (!isMember) {
      return NextResponse.json({ error: "No tienes acceso a este recurso." }, { status: 403 });
    }
    const resource = await container.knowledgeRepository.get(resourceId);
    if (!resource || resource.workspaceId !== id) {
      return NextResponse.json({ error: "No encontramos ese recurso." }, { status: 404 });
    }
    after(() => container.knowledgeRepository.incrementView(resourceId).catch(() => undefined));
    const versions = await container.knowledgeRepository.listVersions(resourceId);
    return NextResponse.json({ resource, versions });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { id, resourceId } = await params;
    const isLeader = await container.projectRepository.isLeader(auth.user.id, id);
    if (!isLeader) {
      return NextResponse.json({ error: "Solo el líder puede editar recursos." }, { status: 403 });
    }
    const existing = await container.knowledgeRepository.get(resourceId);
    if (!existing || existing.workspaceId !== id) {
      return NextResponse.json({ error: "No encontramos ese recurso." }, { status: 404 });
    }

    const parsed = patchSchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json({ error: toFriendlyMessage(parsed.error) }, { status: 400 });
    }
    const { reingest, contentText, ...patch } = parsed.data;

    // Snapshot a version when the meaningful content changes.
    if (contentText && contentText !== existing.contentText) {
      await container.knowledgeRepository.addVersion({
        resourceId,
        version: existing.version,
        title: existing.title,
        contentText: existing.contentText,
        summary: existing.summary,
        changedById: auth.user.id,
        changeNote: "Edit",
      });
      patch.summary = patch.summary;
    }

    const updated = await container.knowledgeRepository.update(resourceId, {
      ...patch,
      ...(contentText ? { contentText } : {}),
    });

    if (reingest ?? Boolean(contentText)) {
      const ingest = knowledgeContainer.ingestDocument();
      after(() =>
        ingest.run({ resource: updated, enrich: false }).catch((err) =>
          console.error("[knowledge-hub] reingest error:", err)
        )
      );
    }

    return NextResponse.json({ resource: updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { id, resourceId } = await params;
    const isLeader = await container.projectRepository.isLeader(auth.user.id, id);
    if (!isLeader) {
      return NextResponse.json({ error: "Solo el líder puede eliminar recursos." }, { status: 403 });
    }
    const existing = await container.knowledgeRepository.get(resourceId);
    if (!existing || existing.workspaceId !== id) {
      return NextResponse.json({ error: "No encontramos ese recurso." }, { status: 404 });
    }
    await container.knowledgeRepository.delete(resourceId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
