import { generateJSON, generateContent, type GeminiResponse } from "./gemini";

/**
 * Alpha Space — Espacio de Pensamiento Estratégico.
 *
 * La IA actúa como coach estratégico: hace preguntas, facilita el pensamiento
 * crítico y NUNCA da respuestas directas ni reemplaza el criterio del líder.
 */

export type AlphaFramework =
  | "strategic_dialogue"
  | "lean_ux"
  | "decision_brief"
  | "action_plan"
  | "difficult_convo"
  | "prep_meeting"
  | "speech_practice";

export interface FrameworkDef {
  key: AlphaFramework;
  name: string;
  tagline: string;
  docKind: string;
  steps: { id: string; label: string; goal: string }[];
}

export const FRAMEWORKS: FrameworkDef[] = [
  {
    key: "strategic_dialogue",
    name: "Diálogo estratégico",
    tagline: "Explora un desafío empresarial en profundidad.",
    docKind: "decision_brief",
    steps: [
      { id: "challenge", label: "Desafío principal", goal: "Identificar con precisión el desafío" },
      { id: "causes", label: "Causas raíz", goal: "Analizar causas subyacentes" },
      { id: "impact", label: "Impacto", goal: "Medir consecuencias de no actuar" },
      { id: "stakeholders", label: "Stakeholders", goal: "Mapear personas e intereses" },
      { id: "risks", label: "Riesgos", goal: "Anticipar riesgos clave" },
      { id: "opportunities", label: "Oportunidades", goal: "Identificar ventajas posibles" },
      { id: "alternatives", label: "Alternativas", goal: "Generar y comparar opciones" },
      { id: "action", label: "Plan de acción", goal: "Definir próximos pasos concretos" },
    ],
  },
  {
    key: "lean_ux",
    name: "Lean UX Canvas",
    tagline: "Diseña una hipótesis de producto o iniciativa.",
    docKind: "lean_ux",
    steps: [
      { id: "problem", label: "Problema", goal: "¿Qué problema de negocio resuelves?" },
      { id: "outcomes", label: "Resultados", goal: "¿Qué resultados esperas?" },
      { id: "users", label: "Usuarios", goal: "¿Para quién es?" },
      { id: "hypotheses", label: "Hipótesis", goal: "¿Qué crees que pasará?" },
      { id: "assumptions", label: "Supuestos", goal: "Supuestos más riesgosos" },
      { id: "experiment", label: "Experimento", goal: "Cómo lo validarás" },
      { id: "action", label: "Plan de acción", goal: "Próximos pasos" },
    ],
  },
  {
    key: "decision_brief",
    name: "Decision Brief",
    tagline: "Prepara una decisión compleja con rigor.",
    docKind: "decision_brief",
    steps: [
      { id: "decision", label: "La decisión", goal: "Qué debes decidir exactamente" },
      { id: "context", label: "Contexto", goal: "Antecedentes relevantes" },
      { id: "options", label: "Opciones", goal: "Alternativas viables" },
      { id: "criteria", label: "Criterios", goal: "Con qué criterios elegir" },
      { id: "tradeoffs", label: "Trade-offs", goal: "Costos de cada opción" },
      { id: "recommendation", label: "Recomendación", goal: "Tu criterio inicial" },
      { id: "action", label: "Plan de acción", goal: "Cómo ejecutar y comunicar" },
    ],
  },
  {
    key: "action_plan",
    name: "Plan de acción",
    tagline: "Convierte una idea en un plan ejecutable.",
    docKind: "action_plan",
    steps: [
      { id: "goal", label: "Meta", goal: "Qué quieres lograr" },
      { id: "success", label: "Éxito", goal: "Cómo se ve el éxito" },
      { id: "steps", label: "Pasos", goal: "Pasos clave para llegar" },
      { id: "resources", label: "Recursos", goal: "Qué necesitas" },
      { id: "risks", label: "Riesgos", goal: "Qué podría fallar" },
      { id: "action", label: "Compromiso", goal: "Tu primer compromiso" },
    ],
  },
  {
    key: "difficult_convo",
    name: "Simulación de conversación difícil",
    tagline: "Ensaya una conversación delicada antes de tenerla.",
    docKind: "feedback_plan",
    steps: [
      { id: "situation", label: "Situación", goal: "Describe la conversación" },
      { id: "person", label: "La otra persona", goal: "Quién es y qué le motiva" },
      { id: "outcome", label: "Resultado deseado", goal: "Qué quieres lograr" },
      { id: "opening", label: "Apertura", goal: "Cómo abrirías la conversación" },
      { id: "rehearsal", label: "Ensayo", goal: "Simula la conversación con la IA" },
      { id: "action", label: "Plan", goal: "Plan para la conversación real" },
    ],
  },
  {
    key: "prep_meeting",
    name: "Preparación de reunión de alto impacto",
    tagline: "Llega listo a esa reunión crítica.",
    docKind: "action_plan",
    steps: [
      { id: "purpose", label: "Propósito", goal: "Por qué es importante esta reunión" },
      { id: "audience", label: "Audiencia", goal: "Quién estará y qué esperan" },
      { id: "message", label: "Mensaje central", goal: "Tu mensaje clave" },
      { id: "objections", label: "Objeciones", goal: "Posibles objeciones y respuestas" },
      { id: "action", label: "Plan", goal: "Agenda y próximos pasos" },
    ],
  },
  {
    key: "speech_practice",
    name: "Práctica de presentación / discurso",
    tagline: "Ensaya y refina un discurso o presentación.",
    docKind: "strategy",
    steps: [
      { id: "occasion", label: "Ocasión", goal: "Contexto del discurso" },
      { id: "audience", label: "Audiencia", goal: "A quién te diriges" },
      { id: "message", label: "Mensaje", goal: "Idea central" },
      { id: "structure", label: "Estructura", goal: "Cómo lo organizarás" },
      { id: "rehearsal", label: "Ensayo", goal: "Practica con la IA" },
      { id: "action", label: "Refinamiento", goal: "Mejoras concretas" },
    ],
  },
];

export function getFramework(key: string): FrameworkDef {
  return FRAMEWORKS.find((f) => f.key === key) ?? FRAMEWORKS[0];
}

/** Límites semanales de sesiones según el plan contratado. */
export const WEEKLY_LIMITS: Record<string, number> = {
  free: 0,
  team: 3,
  business: 25,
};

export function getWeeklyLimit(plan: string): number {
  return WEEKLY_LIMITS[plan] ?? WEEKLY_LIMITS.team;
}

export function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

/* ------------------------------------------------------------------ */
/* AI coach                                                            */
/* ------------------------------------------------------------------ */

export interface CoachContext {
  leaderName: string;
  framework: FrameworkDef;
  stepIndex: number;
  challenge?: string | null;
  history: Array<{ role: "user" | "coach"; content: string }>;
  userInput: string;
}

export interface CoachTurn {
  /** Pregunta o comentario del coach, en tono facilitador. */
  reply: string;
  /** Si el paso actual se considera suficientemente explorado (avanzar). */
  stepComplete: boolean;
  /** Campo del documento a llenar (resumen neutral, máx 2 frases). */
  fieldKey: string | null;
  /** Contenido a guardar en ese campo del documento. */
  fieldValue: string | null;
  /** Sugerencia contextual opcional (framework o pista). */
  suggestion: string | null;
}

const COACH_SYSTEM = `Eres "Atlas", un coach estratégico privado para líderes en Alpha Space. Tu rol: facilitar el pensamiento crítico, NO dar respuestas directas ni reemplazar el criterio del líder.

PRINCIPIOS:
- Haces UNA pregunta a la vez, clara y específica.
- Profundizas con preguntas secuenciales (¿por qué?, ¿y luego?, ¿quién más?).
- Reflejas y sintetizas lo dicho para generar claridad.
- Nunca das la respuesta ni opinas por el líder.
- Eres directo, ejecutivo y respetuoso del tiempo.
- Respondes en español, en máximo 3 frases.

Tu trabajo: llevar al líder a través de un marco de pensamiento estructurado, etapa por etapa, hasta que tenga un documento ejecutivo accionable.`;

export async function generateCoachTurn(ctx: CoachContext): Promise<GeminiResponse<CoachTurn>> {
  const step = ctx.framework.steps[ctx.stepIndex] ?? ctx.framework.steps[0];
  const nextStep = ctx.framework.steps[ctx.stepIndex + 1];
  const history = ctx.history
    .slice(-8)
    .map((h) => `${h.role === "user" ? "Líder" : "Atlas"}: ${h.content}`)
    .join("\n");

  const prompt = `${COACH_SYSTEM}

Líder: ${ctx.leaderName}
Marco: ${ctx.framework.name}
Etapa actual (${ctx.stepIndex + 1}/${ctx.framework.steps.length}): "${step.label}" — ${step.goal}
${nextStep ? `Próxima etapa: "${nextStep.label}"` : "Es la última etapa."}
${ctx.challenge ? `Desafío identificado: ${ctx.challenge}` : ""}

Conversación reciente:
${history || "(inicio de la sesión)"}

El líder acaba de escribir:
"""${ctx.userInput}"""

Decide si lo dicho cubre suficientemente la etapa actual. Responde como Atlas con UNA intervención que: (a) valide o sintetice brevemente, y (b) haga la siguiente pregunta, o anuncie que pasamos a la siguiente etapa.

Responde SOLO con JSON:
{
  "reply": "tu intervención como Atlas, máx 3 frases, en español",
  "stepComplete": boolean,
  "fieldKey": "${step.id} o null",
  "fieldValue": "resumen neutral y ejecutivo de lo dicho en esta etapa (máx 2 frases), o null",
  "suggestion": "pista o framework útil para esta etapa, o null"
}`;

  return generateJSON<CoachTurn>(prompt, { maxTokens: 380, temperature: 0.4 });
}

export interface CoachOpening {
  reply: string;
}

/** Primer mensaje del coach al iniciar una sesión. */
export async function generateCoachOpening(args: {
  leaderName: string;
  framework: FrameworkDef;
}): Promise<GeminiResponse<string>> {
  const step = args.framework.steps[0];
  const prompt = `${COACH_SYSTEM}

Inicia una nueva sesión de "${args.framework.name}" con ${args.leaderName}. Saluda brevemente (1 frase cálida pero ejecutiva), explica en una frase el marco y lanza la primera pregunta de la etapa "${step.label}" (${step.goal}). Máximo 3 frases en total, en español. Sin listas.`;

  return generateContent(prompt, { maxTokens: 200, temperature: 0.4 });
}

/* ------------------------------------------------------------------ */
/* Export helpers                                                      */
/* ------------------------------------------------------------------ */

export interface DocSection {
  id: string;
  label: string;
  content: string;
}

export interface AlphaDocumentData {
  title: string;
  kind: string;
  sections: DocSection[];
}

/** Convierte el documento a un blob descargable según formato. */
export function documentToExport(
  doc: AlphaDocumentData,
  format: "pdf" | "word" | "slides"
): { mime: string; filename: string; content: string } {
  const safeTitle = doc.title.replace(/[^\w\s-]/g, "").trim().slice(0, 60) || "alpha-space";
  if (format === "slides") {
    const slides = [
      `<section><h1>${escapeHtml(doc.title)}</h1><p>Alpha Space · Documento ejecutivo</p></section>`,
      ...doc.sections
        .filter((s) => s.content?.trim())
        .map(
          (s) =>
            `<section><h2>${escapeHtml(s.label)}</h2><p>${escapeHtml(s.content)}</p></section>`
        ),
    ].join("\n");
    return {
      mime: "text/html",
      filename: `${safeTitle}.html`,
      content: `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
        doc.title
      )}</title></head><body>${slides}</body></html>`,
    };
  }
  if (format === "word") {
    const body = doc.sections
      .filter((s) => s.content?.trim())
      .map((s) => `<h2>${escapeHtml(s.label)}</h2><p>${escapeHtml(s.content)}</p>`)
      .join("");
    return {
      mime: "application/vnd.ms-word",
      filename: `${safeTitle}.doc`,
      content: `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${escapeHtml(
        doc.title
      )}</title></head><body><h1>${escapeHtml(doc.title)}</h1>${body}</body></html>`,
    };
  }
  // pdf -> printable HTML
  const body = doc.sections
    .filter((s) => s.content?.trim())
    .map(
      (s) =>
        `<h2 style="font-size:15px;margin:18px 0 6px;color:#222">${escapeHtml(
          s.label
        )}</h2><p style="margin:0;font-size:13px;line-height:1.55;color:#333">${escapeHtml(
          s.content
        )}</p>`
    )
    .join("");
  return {
    mime: "text/html",
    filename: `${safeTitle}.html`,
    content: `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
      doc.title
    )}</title><style>@page{margin:24mm}body{font-family:Georgia,serif;color:#111}h1{font-size:22px}</style></head><body><h1>${escapeHtml(
      doc.title
    )}</h1><p style="color:#888;font-size:12px">Alpha Space · Documento ejecutivo</p>${body}<script>window.onload=function(){window.print()}</script></body></html>`,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
