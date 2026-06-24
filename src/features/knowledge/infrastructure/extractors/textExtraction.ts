import type { KnowledgeFileType } from "../../domain/entities/KnowledgeResource";

/**
 * Pluggable text-extraction contract. Implementations turn a binary blob (PDF,
 * Office, image OCR, ...) into plain text for chunking + embeddings.
 *
 * Heavy parsers (pdfjs, mammoth/docx, sheetjs, tesseract) are loaded lazily and
 * only if present, so the core stays dependency-free. The {@link PlainTextExtractor}
 * handles the common "text/markdown/link" case synchronously.
 */
export interface ITextExtractor {
  /** Returns the plain-text representation, or null if it can't handle the type. */
  extract(input: ExtractInput): Promise<string | null>;
}

export interface ExtractInput {
  fileType: KnowledgeFileType;
  buffer?: Buffer;
  text?: string;
  sourceUrl?: string;
}

export class PlainTextExtractor implements ITextExtractor {
  async extract(input: ExtractInput): Promise<string | null> {
    if (input.text && input.text.trim()) return input.text.trim();
    if (input.fileType === "link" && input.sourceUrl) {
      return `Link resource: ${input.sourceUrl}`;
    }
    return null;
  }
}

/**
 * Composite extractor: tries each registered extractor in order until one
 * returns text. Keeps binary-format extractors optional (loaded only when the
 * consuming feature explicitly registers them).
 */
export class TextExtractorChain implements ITextExtractor {
  private readonly extractors: ITextExtractor[];
  constructor(extractors: ITextExtractor[] = [new PlainTextExtractor()]) {
    this.extractors = extractors;
  }
  async extract(input: ExtractInput): Promise<string | null> {
    for (const extractor of this.extractors) {
      try {
        const text = await extractor.extract(input);
        if (text && text.trim()) return text.trim();
      } catch {
        // continue to next extractor
      }
    }
    return null;
  }
}

let defaultChain: TextExtractorChain | null = null;

export function getTextExtractor(): TextExtractorChain {
  if (!defaultChain) defaultChain = new TextExtractorChain();
  return defaultChain;
}

/** Test-only: register extra extractors (e.g. PDF/Office when libs are present). */
export function setTextExtractor(chain: TextExtractorChain): void {
  defaultChain = chain;
}

export function detectFileType(filename: string, mime?: string): KnowledgeFileType {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (mime?.includes("pdf") || ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "docx";
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return "xlsx";
  if (ext === "ppt" || ext === "pptx") return "pptx";
  if (mime?.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (mime?.startsWith("video/") || ["mp4", "mov", "webm", "mkv"].includes(ext)) return "video";
  if (mime === "text/html" || ext === "html") return "link";
  return "text";
}
