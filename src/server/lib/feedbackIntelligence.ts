import { generateJSON, type GeminiResponse } from "./gemini";

/**
 * Feedback Intelligence — Retroalimentación anónima analizada por IA.
 *
 * Garantías de privacidad:
 *  - Las respuestas nunca se asocian a una persona identificable.
 *  - La IA elimina cualquier referencia identificable antes de resumir.
 *  - Los agregados se publican solo si hay un mínimo de respuestas.
 */

export const MIN_RESPONSES_FOR_INSIGHT = 3;

export const DEFAULT_QUESTIONS = [
  { id: "safety", text: "¿Qué tan seguro te sientes para decir lo que piensas?", type: "scale" },
  { id: "engagement", text: "¿Qué tan comprometido te sientes con el proyecto?", type: "scale" },
  { id: "trust", text: "¿Cuánta confianza tienes en el liderazgo?", type: "scale" },
  { id: "load", text: "¿Cómo está tu carga de trabajo actual?", type: "scale" },
  { id: "collaboration", text: "¿Qué tan bien colabora el equipo?", type: "scale" },
  { id: "open", text: "¿Hay algo que el líder debería saber? (anónimo)", type: "text" },
] as const;

export const CAMPAIGN_PRESETS: Array<{
  kind: string;
  title: string;
  cadence: string;
  questions: { id: string; text: string; type: string }[];
}> = [
  {
    kind: "pulse",
    title: "Pulso semanal",
    cadence: "weekly",
    questions: [...DEFAULT_QUESTIONS],
  },
  {
    kind: "onboarding",
    title: "Onboarding (30 días)",
    cadence: "ad_hoc",
    questions: [
      { id: "clarity", text: "¿Tienes claridad sobre tu rol y objetivos?", type: "scale" },
      { id: "support", text: "¿Sientes el apoyo necesario para arrancar?", type: "scale" },
      { id: "open", text: "¿Qué necesitas que aún no tienes? (anónimo)", type: "text" },
    ],
  },
  {
    kind: "exit",
    title: "Encuesta de salida",
    cadence: "ad_hoc",
    questions: [
      { id: "reason", text: "¿Qué influyó más en tu decisión de irte?", type: "text" },
      { id: "culture", text: "¿Cómo describirías la cultura del equipo?", type: "text" },
      { id: "improve", text: "¿Qué cambiarías del liderazgo?", type: "text" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* IA: análisis de una respuesta individual                            */
/* ------------------------------------------------------------------ */

export interface AnswerAnalysis {
  sentiment: "positive" | "neutral" | "risk" | "negative";
  emotion: "motivated" | "committed" | "stressed" | "uncertain" | "disconnected" | "burned_out" | "neutral";
  scores: {
    psychological_safety?: number; // 0-100
    engagement?: number;
    trust?: number;
    collaboration?: number;
    productivity?: number;
    turnover_risk?: number; // 0-100 (mayor = más riesgo)
  };
  redactedText: string; // texto libre sin info identificable
}

const ANALYSIS_SYSTEM = `Eres un analista de clima organizacional. Analizas respuestas anónimas de feedback y produces métricas neutrales.

REGLA CRÍTICA DE PRIVACIDAD: si el texto menciona nombres, roles específicos, proyectos que identifiquen a una persona, o cualquier dato que pueda revelar la identidad, ELIMÍNALO en redactedText (reemplaza por "[persona]" o "[equipo]"). Nunca conserves identificadores.

Responde SOLO con JSON.`;

export async function analyzeAnswer(args: {
  scaleAnswers: Record<string, number>; // 1-5
  textAnswer: string;
}): Promise<GeminiResponse<AnswerAnalysis>> {
  const prompt = `${ANALYSIS_SYSTEM}

Respuestas en escala (1=muy negativo, 5=muy positivo):
${JSON.stringify(args.scaleAnswers)}

Texto libre:
"""${args.textAnswer || "(sin texto)"}"""

Devuelve:
{
  "sentiment": "positive | neutral | risk | negative",
  "emotion": "motivated | committed | stressed | uncertain | disconnected | burned_out | neutral",
  "scores": {
    "psychological_safety": 0-100,
    "engagement": 0-100,
    "trust": 0-100,
    "collaboration": 0-100,
    "productivity": 0-100,
    "turnover_risk": 0-100
  },
  "redactedText": "texto anonimizado, o cadena vacía"
}`;

  return generateJSON<AnswerAnalysis>(prompt, { maxTokens: 280, temperature: 0.2 });
}

/* ------------------------------------------------------------------ */
/* IA: resumen ejecutivo del conjunto                                  */
/* ------------------------------------------------------------------ */

export interface FeedbackInsight {
  summary: string; // resumen ejecutivo neutral, 2-3 frases
  themes: string[]; // temas recurrentes
  concerns: string[]; // preocupaciones comunes
  strengths: string[]; // fortalezas observadas
  emotions: { emotion: string; count: number }[];
  alerts: {
    type: "burnout" | "conflict" | "turnover" | "culture" | "trust_drop";
    severity: "low" | "medium" | "high";
    detail: string;
  }[];
  recommendations: { priority: "high" | "medium" | "low"; action: string }[];
}

export async function summarizeFeedback(args: {
  responses: Array<{
    sentiment: string;
    emotion: string;
    scores: Record<string, number>;
    redactedText: string;
    createdAt: string;
  }>;
  metrics: MetricSummary;
}): Promise<GeminiResponse<FeedbackInsight>> {
  const sample = args.responses.slice(0, 40);
  const prompt = `${ANALYSIS_SYSTEM}

Ahora produce un RESUMEN EJECUTIVO NEUTRAL para el líder, basado en métricas agregadas y respuestas anonimizadas. Nunca menciones a personas. Sé profesional y accionable.

Métricas promedio (0-100):
${JSON.stringify(args.metrics, null, 2)}

Respuestas anonimizadas (${sample.length}):
${sample
  .map(
    (r, i) =>
      `R${i + 1} [${r.sentiment}/${r.emotion}]: ${r.redactedText || "(solo métricas)"}`
  )
  .join("\n")}

Devuelve JSON:
{
  "summary": "2-3 frases neutrales, ejecutivas",
  "themes": ["tema recurrente", "..."],
  "concerns": ["preocupación común", "..."],
  "strengths": ["fortaleza observada", "..."],
  "emotions": [{ "emotion": "stressed", "count": 3 }],
  "alerts": [
    { "type": "burnout | conflict | turnover | culture | trust_drop", "severity": "low | medium | high", "detail": "señal temprana detectada" }
  ],
  "recommendations": [
    { "priority": "high | medium | low", "action": "acción concreta para el líder" }
  ]
}`;

  return generateJSON<FeedbackInsight>(prompt, { maxTokens: 700, temperature: 0.3 });
}

/* ------------------------------------------------------------------ */
/* Métricas                                                            */
/* ------------------------------------------------------------------ */

export interface MetricSummary {
  productivity: number;
  psychological_safety: number;
  sentiment_score: number;
  engagement: number;
  turnover_risk: number;
  trust: number;
  collaboration: number;
  count: number;
}

export interface MetricKey {
  key: keyof Omit<MetricSummary, "count">;
  label: string;
  goodWhenHigh: boolean;
}

export const METRIC_KEYS: MetricKey[] = [
  { key: "psychological_safety", label: "Seguridad psicológica", goodWhenHigh: true },
  { key: "sentiment_score", label: "Sentimiento general", goodWhenHigh: true },
  { key: "engagement", label: "Compromiso", goodWhenHigh: true },
  { key: "trust", label: "Confianza en el liderazgo", goodWhenHigh: true },
  { key: "collaboration", label: "Colaboración", goodWhenHigh: true },
  { key: "productivity", label: "Productividad", goodWhenHigh: true },
  { key: "turnover_risk", label: "Riesgo de rotación", goodWhenHigh: false },
];

/** Agrega las métricas de muchas respuestas en un promedio 0-100. */
export function aggregateMetrics(
  responses: Array<{
    sentiment: string | null;
    scores: unknown;
  }>
): MetricSummary {
  if (responses.length === 0) {
    return {
      productivity: 0,
      psychological_safety: 0,
      sentiment_score: 0,
      engagement: 0,
      turnover_risk: 0,
      trust: 0,
      collaboration: 0,
      count: 0,
    };
  }
  const acc: Record<string, { sum: number; n: number }> = {};
  const sentimentMap: Record<string, number> = { positive: 90, neutral: 60, risk: 35, negative: 15 };
  let sentimentSum = 0;
  let sentimentN = 0;

  for (const r of responses) {
    if (r.sentiment) {
      sentimentSum += sentimentMap[r.sentiment] ?? 50;
      sentimentN++;
    }
    const scores = (r.scores as Record<string, number | undefined> | null) ?? {};
    for (const [k, v] of Object.entries(scores)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        acc[k] = acc[k] ?? { sum: 0, n: 0 };
        acc[k].sum += v;
        acc[k].n++;
      }
    }
  }
  const avg = (k: string) => (acc[k] ? Math.round(acc[k].sum / acc[k].n) : 0);
  return {
    productivity: avg("productivity"),
    psychological_safety: avg("psychological_safety"),
    sentiment_score: sentimentN ? Math.round(sentimentSum / sentimentN) : 0,
    engagement: avg("engagement"),
    turnover_risk: avg("turnover_risk"),
    trust: avg("trust"),
    collaboration: avg("collaboration"),
    count: responses.length,
  };
}

export function metricColor(value: number, goodWhenHigh: boolean): string {
  // 0-100 → color (rojo → ámbar → verde)
  const v = goodWhenHigh ? value : 100 - value;
  if (v >= 70) return "var(--color-sage)";
  if (v >= 45) return "var(--color-accent)";
  return "var(--color-glow)";
}

export function metricLabel(value: number): string {
  if (value >= 70) return "Saludable";
  if (value >= 45) return "Atención";
  return "Crítico";
}
