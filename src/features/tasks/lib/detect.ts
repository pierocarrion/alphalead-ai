import {
  detectTaskWithGemini,
  geminiDraftToDetectedTaskDraft,
  isGeminiEnabled,
  shouldUseFallback,
} from "@/server/lib/gemini";
import { createLogger } from "@/shared/lib/logger";

const log = createLogger("task:detect");

export interface DetectedTaskDraft {
  title: string;
  fromQuote: string;
  category: string;
  app: string;
  due: string;
  deadline: Date | null;
  load: "Light" | "Medium" | "Heavy";
  micro: string;
  action: string;
  resource: string;
  selfMade: boolean;
  confidence: number; // 0-1
}

const TASK_WORDS = [
  "deck",
  "report",
  "write",
  "draft",
  "finish",
  "prepare",
  "review",
  "send",
  "email",
  "fix",
  "build",
  "design",
  "plan",
  "need to",
  "have to",
  "should",
  "tomorrow",
  "friday",
  "monday",
  "by ",
  "before",
  "document",
  "spec",
  "proposal",
  "presentation",
  "slides",
  "update",
  "ship",
  "handle",
  "take care",
  "organize",
  "schedule",
  "call",
  "follow up",
  "summarize",
  "outline",
];

const ASSIGNMENT_MARKERS = [
  "can you",
  "could you",
  "would you",
  "will you",
  "do you mind",
  "can you please",
  "need you to",
  "want you to",
  "assigned to you",
  "your task",
  "for you",
  "maya",
];

const LOAD_MARKERS: { pattern: RegExp; load: DetectedTaskDraft["load"] }[] = [
  { pattern: /big|huge|massive|major|complex|rewrite|rearchitect|from scratch|whole/i, load: "Heavy" },
  { pattern: /medium|decent|solid chunk|a few hours|slide deck|deck|report|prepare|proposal|spec/i, load: "Medium" },
  { pattern: /quick|small|tiny|one line|one sentence|short|brief|2.minute|5.minute|email|send|reply/i, load: "Light" },
];

const MICRO_TEMPLATES: Record<string, string[]> = {
  Slides: [
    "Open the deck and type one messy sentence — just one.",
    "Create one blank slide and write the title.",
  ],
  Docs: [
    "Open the doc and write one rough paragraph.",
    "Create a blank doc and type the heading.",
  ],
  Comms: [
    "Open the draft and write the first sentence of the body.",
    "Add the recipient and write the subject line.",
  ],
  Build: [
    "Open the repo and read the README for 2 minutes.",
    "Create one failing test that describes the fix.",
  ],
  General: [
    "Open it and do the first tiny piece — one line, one click. Then you’re free to stop.",
    "Spend 2 minutes just looking at it. That counts.",
  ],
};

const ACTION_TEMPLATES: Record<string, string[]> = {
  Slides: ["one messy sentence", "the title slide"],
  Docs: ["one rough paragraph", "the heading"],
  Comms: ["the first sentence", "the subject line"],
  Build: ["read the README", "one failing test"],
  General: ["the first tiny piece", "the first 2 minutes"],
};

export function looksLikeTask(text: string): boolean {
  const t = text.toLowerCase();
  return TASK_WORDS.some((w) => t.includes(w.toLowerCase()));
}

export function looksLikeAssignment(text: string): boolean {
  const t = text.toLowerCase();
  return ASSIGNMENT_MARKERS.some((m) => t.includes(m.toLowerCase()));
}

export function estimateLoad(text: string): DetectedTaskDraft["load"] {
  const lower = text.toLowerCase();
  for (const marker of LOAD_MARKERS) {
    if (marker.pattern.test(lower)) return marker.load;
  }
  return "Light";
}

function extractDeadline(text: string): { due: string; deadline: Date | null } {
  const now = new Date();
  const lower = text.toLowerCase();

  if (/tomorrow/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return { due: "tomorrow", deadline: d };
  }
  if (/tonight/.test(lower)) {
    const d = new Date(now);
    d.setHours(23, 59, 0, 0);
    return { due: "tonight", deadline: d };
  }
  if (/this week/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 3);
    return { due: "this week", deadline: d };
  }
  if (/next week/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return { due: "next week", deadline: d };
  }
  if (/friday/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
    return { due: "Friday", deadline: d };
  }
  if (/monday/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + ((1 - d.getDay() + 7) % 7 || 7));
    return { due: "Monday", deadline: d };
  }

  const dateMatch = text.match(/(by|before)\s+(\d{1,2})\/(\d{1,2})/i);
  if (dateMatch) {
    const [, , month, day] = dateMatch;
    const d = new Date(now.getFullYear(), parseInt(month, 10) - 1, parseInt(day, 10));
    return { due: `${month}/${day}`, deadline: d };
  }

  return { due: "no deadline yet", deadline: null };
}

function categoryFor(text: string): { category: string; app: string } {
  const t = text.toLowerCase();
  if (/deck|slide|present|pitch/.test(t)) return { category: "Slides", app: "Acme Deck Hub" };
  if (/report|doc|spec|write|proposal|note|summary|brief/.test(t))
    return { category: "Docs", app: "Acme Docs" };
  if (/email|send|reply|message|dm|slack|write back/.test(t))
    return { category: "Comms", app: "Mail" };
  if (/fix|build|ship|design|code|bug|feature|deploy|test/.test(t))
    return { category: "Build", app: "Acme Tracker" };
  if (/call|meeting|sync|schedule|calendar/.test(t))
    return { category: "Meetings", app: "Calendar" };
  if (/review|feedback|approve/.test(t)) return { category: "Review", app: "Acme Tracker" };
  return { category: "General", app: "Knowledge base" };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function deriveTask(text: string, fromWho?: string): DetectedTaskDraft {
  const clean = text.trim().replace(/\s+/g, " ");
  const words = clean.split(" ");
  let title = words.slice(0, 8).join(" ");
  title = title.charAt(0).toUpperCase() + title.slice(1);
  if (words.length > 8) title += "…";

  const { category, app } = categoryFor(clean);
  const load = estimateLoad(clean);
  const { due, deadline } = extractDeadline(clean);
  const selfMade = fromWho ? false : !looksLikeAssignment(clean);

  return {
    title,
    fromQuote: `“${clean.length > 60 ? clean.slice(0, 60) + "…" : clean}”`,
    category,
    app,
    due,
    deadline,
    load,
    micro: pick(MICRO_TEMPLATES[category] ?? MICRO_TEMPLATES.General),
    action: pick(ACTION_TEMPLATES[category] ?? ACTION_TEMPLATES.General),
    resource: category === "Slides" ? "Untitled.key" : category === "Build" ? "Repo" : "Untitled.doc",
    selfMade,
    confidence: looksLikeAssignment(clean) ? 0.9 : 0.75,
  };
}

/**
 * Enhanced task derivation that optionally calls Gemini to enrich the draft.
 * Falls back to the heuristic engine if Gemini is disabled, misconfigured, or fails.
 */
export async function deriveTaskEnhanced(
  text: string,
  fromWho?: string
): Promise<DetectedTaskDraft> {
  const heuristic = deriveTask(text, fromWho);

  if (!isGeminiEnabled()) {
    return heuristic;
  }

  try {
    const gemini = await detectTaskWithGemini(text, fromWho);
    if (!gemini.ok || !gemini.data || !gemini.data.isTask) {
      if (shouldUseFallback()) return heuristic;
      return { ...heuristic, confidence: 0.25 };
    }

    const draft = geminiDraftToDetectedTaskDraft(gemini.data, text, fromWho);

    // Preserve deadline extraction from the heuristic engine (Gemini doesn't parse dates robustly here)
    const { due, deadline } = extractDeadline(text);
    return {
      ...draft,
      due,
      deadline,
      // Keep category/app/resource from heuristic if Gemini returns overly generic values
      category: draft.category === "General" && heuristic.category !== "General"
        ? heuristic.category
        : draft.category,
      app: draft.app === "Knowledge base" && heuristic.app !== "Knowledge base"
        ? heuristic.app
        : draft.app,
      resource: draft.resource === "Untitled.doc" && heuristic.resource !== "Untitled.doc"
        ? heuristic.resource
        : draft.resource,
    };
  } catch (err) {
    log.error("deriveTaskEnhanced Gemini failed, using heuristic", err);
    if (shouldUseFallback()) return heuristic;
    throw err;
  }
}

/**
 * Synchronous fallback for callers that cannot await.
 * Use deriveTaskEnhanced for production Gemini enrichment.
 */
export function deriveTaskSync(text: string, fromWho?: string): DetectedTaskDraft {
  return deriveTask(text, fromWho);
}

export const DECK_TASK: DetectedTaskDraft = {
  title: "Draft the Q3 launch deck",
  fromQuote: "“a first rough draft of the launch deck”",
  category: "Slides",
  app: "Acme Deck Hub",
  due: "before Thursday",
  deadline: null,
  load: "Medium",
  micro: "Open the deck and type one messy sentence. That’s the whole job.",
  action: "one messy sentence",
  resource: "Q3 Launch Deck.key",
  selfMade: false,
  confidence: 0.95,
};
