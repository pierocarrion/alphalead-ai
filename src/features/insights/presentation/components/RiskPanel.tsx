"use client";

import type { TeamOverview } from "../types";
import { Panel, StatChip } from "./Panel";
import { RadialMeter } from "./charts";

const LEVEL_COPY: Record<string, { title: string; helper: string }> = {
  low: {
    title: "Bajo",
    helper: "El equipo mantiene un ritmo saludable.",
  },
  moderate: {
    title: "Moderado",
    helper: "Vale la pena anticipar cuellos de botella.",
  },
  high: {
    title: "Alto",
    helper: "Conviene redistribuir carga y revisar bloqueos.",
  },
};

export function RiskPanel({ overview }: { overview: TeamOverview }) {
  const r = overview.productivityRisk;
  const copy = LEVEL_COPY[r.level];
  const factors = [
    { label: "Sobrecarga", value: r.breakdown.overload },
    { label: "Retrasos", value: r.breakdown.overdue },
    { label: "Caída actividad", value: r.breakdown.activityDecline },
    { label: "Baja participación", value: r.breakdown.lowParticipation },
    { label: "Incumplimiento", value: r.breakdown.taskMiss },
    { label: "Ausentismo", value: r.breakdown.absenteeism },
  ];
  return (
    <Panel kicker="Productivity Risk" title="Riesgo de productividad">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <RadialMeter
          score={r.score}
          status={r.level}
          invert
          label={copy.title}
        />
        <div className="flex-1">
          <p className="mb-3 text-xs text-ink-3 text-wrap-pretty">
            {copy.helper}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {factors.map((f) => (
              <StatChip
                key={f.label}
                label={f.label}
                value={Math.round(f.value)}
                tone={
                  f.value >= 60 ? "bad" : f.value >= 35 ? "warn" : "good"
                }
              />
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
