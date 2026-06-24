"use client";

import type { TeamOverview } from "../types";
import { Panel } from "./Panel";
import { Gauge, LineTrend } from "./charts";

const STATUS_COPY: Record<string, { title: string; helper: string }> = {
  healthy: {
    title: "Saludable",
    helper: "El equipo se siente seguro para opinar y cometer errores.",
  },
  moderate: {
    title: "Moderado",
    helper: "Hay espacio para abrir conversaciones de confianza.",
  },
  critical: {
    title: "Crítico",
    helper: "Conviene reforzar escucha activa y reconocimiento.",
  },
};

export function SafetyPanel({ overview }: { overview: TeamOverview }) {
  const s = overview.psychologicalSafety;
  const copy = STATUS_COPY[s.status];
  return (
    <Panel kicker="Psychological Safety" title="Bienestar psicológico">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <Gauge
          score={s.score}
          status={s.status}
          label={copy.title}
        />
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-2">
            <MiniBar label="Encuestas" value={s.breakdown.survey} />
            <MiniBar label="Feedback" value={s.breakdown.feedback} />
            <MiniBar label="Participación" value={s.breakdown.participation} />
            <MiniBar label="Sentimiento" value={s.breakdown.sentiment} />
          </div>
          <p className="mt-3 text-xs text-ink-3 text-wrap-pretty">
            {copy.helper}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
          Tendencia
        </p>
        <LineTrend
          points={s.trend.filter((p) => p.score > 0)}
          ariaLabel="Tendencia de Psychological Safety"
        />
      </div>
    </Panel>
  );
}

function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-ink-3">{label}</span>
        <span className="font-semibold text-ink-2">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line-2/40">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, value)}%`,
            background: "var(--color-accent)",
          }}
        />
      </div>
    </div>
  );
}
