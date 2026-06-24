import { prisma } from "@/server/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  CreateCategoryInput,
  CreateResourceInput,
  IKnowledgeRepository,
  ListResourcesFilter,
  UpdateResourceInput,
} from "../../domain/repositories/IKnowledgeRepository";
import type {
  KnowledgeCategory,
  KnowledgeResource,
  KnowledgeResourceVersion,
  KnowledgeResourceWithRelations,
  KnowledgeSuggestion,
} from "../../domain/entities/KnowledgeResource";

function toCategory(row: {
  id: string;
  workspaceId: string;
  key: string;
  name: string;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}): KnowledgeCategory {
  return { ...row };
}

function toResource(row: {
  id: string;
  workspaceId: string;
  categoryId: string | null;
  title: string;
  summary: string | null;
  contentText: string;
  fileType: string;
  storageKey: string | null;
  sourceUrl: string | null;
  sourceApp: string | null;
  sourceType: string;
  authorId: string | null;
  projectId: string | null;
  accessLevel: string;
  isPremium: boolean;
  tags: string[];
  keywords: string[];
  status: string;
  viewCount: number;
  useCount: number;
  aiMetadata: unknown;
  version: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}): KnowledgeResource {
  return {
    ...row,
    fileType: row.fileType as KnowledgeResource["fileType"],
    accessLevel: row.accessLevel as KnowledgeResource["accessLevel"],
    status: row.status as KnowledgeResource["status"],
    aiMetadata: (row.aiMetadata as Record<string, unknown> | null) ?? null,
  };
}

export class PrismaKnowledgeRepository implements IKnowledgeRepository {
  async listCategories(workspaceId: string): Promise<KnowledgeCategory[]> {
    const rows = await prisma.knowledgeCategory.findMany({
      where: { workspaceId },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return rows.map(toCategory);
  }

  async createCategory(input: CreateCategoryInput): Promise<KnowledgeCategory> {
    const row = await prisma.knowledgeCategory.create({ data: input });
    return toCategory(row);
  }

  async findCategoryByKey(workspaceId: string, key: string): Promise<KnowledgeCategory | null> {
    const row = await prisma.knowledgeCategory.findUnique({
      where: { workspaceId_key: { workspaceId, key } },
    });
    return row ? toCategory(row) : null;
  }

  async get(id: string): Promise<KnowledgeResourceWithRelations | null> {
    const row = await prisma.knowledgeResource.findUnique({
      where: { id },
      include: { category: true, _count: { select: { chunks: true } } },
    });
    if (!row) return null;
    const { category, ...rest } = row;
    return {
      ...toResource(rest),
      category: category ? toCategory(category) : null,
      _chunkCount: row._count?.chunks,
    };
  }

  private buildWhere(filter: ListResourcesFilter): Prisma.KnowledgeResourceWhereInput {
    const where: Prisma.KnowledgeResourceWhereInput = {
      workspaceId: filter.workspaceId,
      status: "active",
    };
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.tag) where.tags = { has: filter.tag };
    if (typeof filter.isPremium === "boolean") where.isPremium = filter.isPremium;
    if (filter.fileType) where.fileType = filter.fileType;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: "insensitive" } },
        { summary: { contains: filter.search, mode: "insensitive" } },
        { contentText: { contains: filter.search, mode: "insensitive" } },
        { tags: { has: filter.search } },
        { keywords: { has: filter.search } },
      ];
    }
    return where;
  }

  async list(filter: ListResourcesFilter): Promise<KnowledgeResourceWithRelations[]> {
    const rows = await prisma.knowledgeResource.findMany({
      where: this.buildWhere(filter),
      include: { category: true, _count: { select: { chunks: true } } },
      orderBy: { updatedAt: "desc" },
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
    });
    return rows.map((row) => {
      const { category, _count, ...rest } = row;
      return {
        ...toResource(rest),
        category: category ? toCategory(category) : null,
        _chunkCount: _count?.chunks,
      };
    });
  }

  async count(filter: ListResourcesFilter): Promise<number> {
    return prisma.knowledgeResource.count({ where: this.buildWhere(filter) });
  }

  async create(input: CreateResourceInput): Promise<KnowledgeResource> {
    const row = await prisma.knowledgeResource.create({
      data: {
        workspaceId: input.workspaceId,
        categoryId: input.categoryId ?? null,
        title: input.title,
        summary: input.summary ?? null,
        contentText: input.contentText,
        fileType: input.fileType ?? "text",
        storageKey: input.storageKey ?? null,
        sourceUrl: input.sourceUrl ?? null,
        sourceApp: input.sourceApp ?? null,
        sourceType: input.sourceType ?? "manual",
        authorId: input.authorId ?? null,
        projectId: input.projectId ?? null,
        accessLevel: input.accessLevel ?? "workspace",
        isPremium: input.isPremium ?? false,
        tags: input.tags ?? [],
        keywords: input.keywords ?? [],
        aiMetadata: (input.aiMetadata as Prisma.InputJsonValue) ?? null,
        createdById: input.createdById ?? null,
      },
    });
    return toResource(row);
  }

  async update(id: string, patch: UpdateResourceInput): Promise<KnowledgeResource> {
    const data: Prisma.KnowledgeResourceUpdateInput = {};
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.summary !== undefined) data.summary = patch.summary;
    if (patch.contentText !== undefined) data.contentText = patch.contentText;
    if (patch.accessLevel !== undefined) data.accessLevel = patch.accessLevel;
    if (patch.isPremium !== undefined) data.isPremium = patch.isPremium;
    if (patch.tags !== undefined) data.tags = { set: patch.tags };
    if (patch.keywords !== undefined) data.keywords = { set: patch.keywords };
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.aiMetadata !== undefined)
      data.aiMetadata = patch.aiMetadata as Prisma.InputJsonValue;
    if (patch.categoryId !== undefined) {
      data.category = patch.categoryId
        ? { connect: { id: patch.categoryId } }
        : { disconnect: true };
    }
    const row = await prisma.knowledgeResource.update({ where: { id }, data });
    return toResource(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.knowledgeResource.delete({ where: { id } });
  }

  async incrementView(id: string): Promise<void> {
    await prisma.knowledgeResource.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async incrementUse(id: string): Promise<void> {
    await prisma.knowledgeResource.update({
      where: { id },
      data: { useCount: { increment: 1 } },
    });
  }

  async replaceChunks(
    resourceId: string,
    chunks: { text: string; tokenCount?: number }[]
  ): Promise<void> {
    await prisma.$transaction([
      prisma.knowledgeChunk.deleteMany({ where: { resourceId } }),
      ...chunks.map((chunk, idx) =>
        prisma.knowledgeChunk.create({
          data: { resourceId, ordinal: idx, text: chunk.text, tokenCount: chunk.tokenCount ?? null },
        })
      ),
    ]);
  }

  async listChunks(resourceId: string) {
    return prisma.knowledgeChunk.findMany({
      where: { resourceId },
      orderBy: { ordinal: "asc" },
      select: { id: true, ordinal: true, text: true, tokenCount: true },
    });
  }

  async getChunk(chunkId: string) {
    const row = await prisma.knowledgeChunk.findUnique({
      where: { id: chunkId },
      select: { id: true, resourceId: true, ordinal: true, text: true },
    });
    return row;
  }

  async listVersions(resourceId: string): Promise<KnowledgeResourceVersion[]> {
    return prisma.knowledgeResourceVersion.findMany({
      where: { resourceId },
      orderBy: { version: "desc" },
    });
  }

  async addVersion(input: Omit<KnowledgeResourceVersion, "id" | "createdAt">): Promise<KnowledgeResourceVersion> {
    return prisma.knowledgeResourceVersion.create({ data: input });
  }

  async listSuggestions(workspaceId: string, targetUserId?: string): Promise<KnowledgeSuggestion[]> {
    return prisma.knowledgeSuggestion.findMany({
      where: {
        workspaceId,
        dismissed: false,
        ...(targetUserId ? { targetUserId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  async addSuggestion(input: {
    workspaceId: string;
    resourceId?: string | null;
    targetUserId?: string | null;
    reason: string;
    kind?: string;
  }): Promise<KnowledgeSuggestion> {
    return prisma.knowledgeSuggestion.create({
      data: {
        workspaceId: input.workspaceId,
        resourceId: input.resourceId ?? null,
        targetUserId: input.targetUserId ?? null,
        reason: input.reason,
        kind: input.kind ?? "topic_match",
      },
    });
  }

  async dismissSuggestion(id: string): Promise<void> {
    await prisma.knowledgeSuggestion.update({
      where: { id },
      data: { dismissed: true },
    });
  }
}
