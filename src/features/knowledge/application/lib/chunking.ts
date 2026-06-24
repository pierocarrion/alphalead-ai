/**
 * Deterministic text chunking for RAG ingestion.
 *
 * Strategy: split on paragraph boundaries, then greedily pack sentences into
 * chunks up to `targetTokens`, overlapping by `overlap` to preserve context at
 * boundaries. Token count is approximated by a word/4 heuristic (provider
 * agnostic; exact tokenization is the embedder's job).
 */

export interface ChunkOptions {
  targetTokens?: number;
  overlapTokens?: number;
  minTokens?: number;
}

export interface TextChunk {
  text: string;
  tokenCount: number;
  ordinal: number;
}

const APPROX_CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.ceil(trimmed.length / APPROX_CHARS_PER_TOKEN));
}

function splitSentences(text: string): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  // Sentence-aware split, keeping headings/bullets as atomic units.
  return clean
    .split(/(?<=[.!?。])\s+(?=[A-Z0-9¿¡])|(?<=\n)\s*(?=[-•*\d])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
  const target = options.targetTokens ?? 350;
  const overlap = options.overlapTokens ?? 60;
  const min = options.minTokens ?? 10;

  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  const chunks: TextChunk[] = [];
  let buffer: string[] = [];
  let bufferTokens = 0;

  const flush = (ordinal: number) => {
    const joined = buffer.join(" ").trim();
    if (joined && estimateTokens(joined) >= min) {
      chunks.push({ text: joined, tokenCount: estimateTokens(joined), ordinal });
    }
  };

  let ordinal = 0;
  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);
    // Hard-split overly long sentences.
    if (sentenceTokens > target * 1.5) {
      if (buffer.length) {
        flush(ordinal++);
        buffer = [];
        bufferTokens = 0;
      }
      const pieces = splitLongSentence(sentence, target);
      for (const piece of pieces) {
        chunks.push({ text: piece, tokenCount: estimateTokens(piece), ordinal: ordinal++ });
      }
      continue;
    }

    if (bufferTokens + sentenceTokens > target && buffer.length) {
      flush(ordinal++);
      // Keep an overlap window for context continuity.
      const overlapBuf: string[] = [];
      let overlapTok = 0;
      for (let i = buffer.length - 1; i >= 0; i--) {
        const t = estimateTokens(buffer[i]);
        if (overlapTok + t > overlap) break;
        overlapBuf.unshift(buffer[i]);
        overlapTok += t;
      }
      buffer = overlapBuf;
      bufferTokens = overlapTok;
    }

    buffer.push(sentence);
    bufferTokens += sentenceTokens;
  }
  if (buffer.length) flush(ordinal++);

  return chunks;
}

function splitLongSentence(sentence: string, targetTokens: number): string[] {
  const maxChars = targetTokens * APPROX_CHARS_PER_TOKEN;
  const pieces: string[] = [];
  let rest = sentence;
  while (rest.length > maxChars) {
    let cut = rest.lastIndexOf(" ", maxChars);
    if (cut <= 0) cut = maxChars;
    pieces.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) pieces.push(rest);
  return pieces;
}

/** Concatenates chunk text around a hit for display snippets. */
export function buildSnippet(text: string, maxChars = 280): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  return clean.slice(0, maxChars - 1).trimEnd() + "…";
}
