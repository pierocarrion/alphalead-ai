/** Domain entity: a category in the Knowledge Hub library. */
export interface KnowledgeCategory {
  id: string;
  workspaceId: string;
  key: string;
  name: string;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type KnowledgeFileType =
  | "text"
  | "pdf"
  | "docx"
  | "xlsx"
  | "pptx"
  | "image"
  | "video"
  | "link";

export type KnowledgeAccessLevel = "workspace" | "leaders" | "members";

export interface KnowledgeResource {
  id: string;
  workspaceId: string;
  categoryId: string | null;
  title: string;
  summary: string | null;
  contentText: string;
  fileType: KnowledgeFileType;
  storageKey: string | null;
  sourceUrl: string | null;
  sourceApp: string | null;
  sourceType: string;
  authorId: string | null;
  projectId: string | null;
  accessLevel: KnowledgeAccessLevel;
  isPremium: boolean;
  tags: string[];
  keywords: string[];
  status: "active" | "processing" | "archived";
  viewCount: number;
  useCount: number;
  aiMetadata: Record<string, unknown> | null;
  version: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeChunk {
  id: string;
  resourceId: string;
  ordinal: number;
  text: string;
  tokenCount: number | null;
}

export interface KnowledgeResourceVersion {
  id: string;
  resourceId: string;
  version: number;
  title: string;
  contentText: string;
  summary: string | null;
  changedById: string | null;
  changeNote: string | null;
  createdAt: Date;
}

export interface KnowledgeSuggestion {
  id: string;
  workspaceId: string;
  resourceId: string | null;
  targetUserId: string | null;
  reason: string;
  kind: string;
  dismissed: boolean;
  createdAt: Date;
}

export interface KnowledgeResourceWithRelations extends KnowledgeResource {
  category: KnowledgeCategory | null;
  _chunkCount?: number;
}
