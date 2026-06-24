/**
 * AI provider layer — single entrypoint. New features import from here.
 *
 * Vendors are selected via env:
 *  - `AI_PROVIDER`           gemini (default) | openai | azure-openai | claude
 *  - `AI_EMBEDDING_PROVIDER`  openai (default) | gemini | azure-openai | claude
 */
export type {
  AiChatRequest,
  AiEmbeddingConfig,
  AiMessage,
  AiModelInfo,
  AiResult,
  AiRole,
  IAiEmbedder,
  IAiProvider,
} from "./types";

export { AI_FRIENDLY, toFriendlyAiError } from "./errors";
export { getAiClient, __resetAiClient } from "./client";
export type { AiClient } from "./client";
export {
  createAiProvider,
  createEmbedder,
  readProviderName,
} from "./factory";
export type { AiProviderName } from "./factory";
export {
  cosineSimilarity,
  getVectorStore,
  InMemoryVectorStore,
  setVectorStore,
} from "./vectorStore";
export type { IVectorStore, VectorQueryResult, VectorRecord } from "./vectorStore";
