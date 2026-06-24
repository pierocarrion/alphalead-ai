-- CreateTable: KnowledgeCategory
CREATE TABLE "KnowledgeCategory" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCategory_workspaceId_key_key" ON "KnowledgeCategory"("workspaceId", "key");
CREATE INDEX "KnowledgeCategory_workspaceId_idx" ON "KnowledgeCategory"("workspaceId");

-- AddForeignKey
ALTER TABLE "KnowledgeCategory" ADD CONSTRAINT "KnowledgeCategory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: KnowledgeResource
CREATE TABLE "KnowledgeResource" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "contentText" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'text',
    "storageKey" TEXT,
    "sourceUrl" TEXT,
    "sourceApp" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "authorId" TEXT,
    "projectId" TEXT,
    "accessLevel" TEXT NOT NULL DEFAULT 'workspace',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "aiMetadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeResource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KnowledgeResource_workspaceId_status_idx" ON "KnowledgeResource"("workspaceId", "status");
CREATE INDEX "KnowledgeResource_workspaceId_categoryId_idx" ON "KnowledgeResource"("workspaceId", "categoryId");
CREATE INDEX "KnowledgeResource_workspaceId_isPremium_idx" ON "KnowledgeResource"("workspaceId", "isPremium");
CREATE INDEX "KnowledgeResource_workspaceId_updatedAt_idx" ON "KnowledgeResource"("workspaceId", "updatedAt");

ALTER TABLE "KnowledgeResource" ADD CONSTRAINT "KnowledgeResource_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeResource" ADD CONSTRAINT "KnowledgeResource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KnowledgeCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: KnowledgeChunk
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KnowledgeChunk_resourceId_ordinal_idx" ON "KnowledgeChunk"("resourceId", "ordinal");

ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "KnowledgeResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: KnowledgeResourceVersion
CREATE TABLE "KnowledgeResourceVersion" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "contentText" TEXT NOT NULL,
    "summary" TEXT,
    "changedById" TEXT,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeResourceVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KnowledgeResourceVersion_resourceId_version_idx" ON "KnowledgeResourceVersion"("resourceId", "version");

ALTER TABLE "KnowledgeResourceVersion" ADD CONSTRAINT "KnowledgeResourceVersion_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "KnowledgeResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: KnowledgeSuggestion
CREATE TABLE "KnowledgeSuggestion" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "resourceId" TEXT,
    "targetUserId" TEXT,
    "reason" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'topic_match',
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KnowledgeSuggestion_workspaceId_createdAt_idx" ON "KnowledgeSuggestion"("workspaceId", "createdAt");
CREATE INDEX "KnowledgeSuggestion_targetUserId_dismissed_idx" ON "KnowledgeSuggestion"("targetUserId", "dismissed");

ALTER TABLE "KnowledgeSuggestion" ADD CONSTRAINT "KnowledgeSuggestion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeSuggestion" ADD CONSTRAINT "KnowledgeSuggestion_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "KnowledgeResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
