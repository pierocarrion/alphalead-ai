import { NextResponse } from "next/server";
import { after } from "next/server";
import { requireUser } from "@/server/lib/auth";
import { container } from "@/server/lib/container";
import { jsonError } from "@/server/lib/apiErrors";
import { knowledgeContainer } from "@/features/knowledge/infrastructure/knowledgeContainer";
import {
  detectFileType,
  getTextExtractor,
} from "@/features/knowledge/infrastructure/extractors/textExtraction";
import { getVectorStore } from "@/server/lib/ai/vectorStore";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

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
      return NextResponse.json({ error: "Solo el líder puede subir recursos." }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const categoryId = (form.get("categoryId") as string | null) ?? null;
    const tagsRaw = (form.get("tags") as string | null) ?? "";
    const isPremium = form.get("premium") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Adjunta un archivo (campo 'file')." }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "El archivo está vacío." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "El archivo supera los 15 MB." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = detectFileType(file.name, file.type);
    const storageKey = `${id}/${randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;

    const storage = knowledgeContainer.storage();
    await storage.put(storageKey, buffer, file.type || "application/octet-stream");

    const extractor = getTextExtractor();
    const extracted = await extractor.extract({
      fileType,
      buffer,
      sourceUrl: undefined,
    });
    const contentText = extracted?.trim() || `Recurso subido: ${file.name}`;

    const resource = await container.knowledgeRepository.create({
      workspaceId: id,
      title: file.name.replace(/\.[^.]+$/, ""),
      contentText,
      categoryId,
      fileType,
      storageKey,
      sourceType: "upload",
      sourceApp: "upload",
      tags: tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isPremium,
      createdById: auth.user.id,
    });

    after(async () => {
      const ingest = knowledgeContainer.ingestDocument();
      await ingest
        .run({ resource, enrich: true })
        .catch((err) => console.error("[knowledge-hub] upload ingest error:", err));
      // Clean up any stale vectors on failure is handled by idempotent re-run.
      void getVectorStore;
    });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
