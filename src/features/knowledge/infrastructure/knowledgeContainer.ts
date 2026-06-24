import { container } from "@/server/lib/container";
import { getAiClient } from "@/server/lib/ai";
import { getFileStorage } from "@/server/lib/storage";
import { IngestDocument } from "../application/use-cases/IngestDocument";
import { SearchKnowledge } from "../application/use-cases/SearchKnowledge";

/**
 * Composition root for the Knowledge Hub use cases. Wires concrete
 * infrastructure (Prisma repo, AI client, file storage) into the application
 * layer once; consumers resolve dependencies from here (single import point).
 */
export const knowledgeContainer = {
  repository: () => container.knowledgeRepository,
  ai: () => getAiClient(),
  storage: () => getFileStorage(),
  ingestDocument: () => new IngestDocument(container.knowledgeRepository, getAiClient()),
  searchKnowledge: () => new SearchKnowledge(container.knowledgeRepository, getAiClient()),
};

export type KnowledgeContainer = typeof knowledgeContainer;
