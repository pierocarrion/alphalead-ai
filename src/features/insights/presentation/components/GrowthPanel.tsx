"use client";

import type { TeamOverview, GrowthGranularity } from "../types";
import { Panel } from "./Panel";
import { LineTrend } from "./charts";
import { cn } from "@/shared/lib/cn";

const GRANULARITIES: { value: GrowthGranularity; label: string }[] = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Año" },
];

export function GrowthPanel({
  overview,
  granularity,
  onGranularity,
}: {
  overview: TeamOverview;
  granularity: GrowthGranularity;
  onGranularity: (g: GrowthGranularity) => void;
}) {
  const g = overview.growth;
  const deltaPositive = g.deltaPct >= 0;
  return (
    <Panel
      kicker="Team Growth"
      title="Crecimiento del equipo"
      action={
        <div className="flex gap-1 rounded-button bg-white/[0.03] p-1">
          {GRANULARITIES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onGranularity(opt.value)}
              className={cn(
                "rounded-button px-2.5 py-1 text-[11px] font-semibold transition-colors",
                granularity === opt.value
                  ? "bg-accent text-accent-ink"
                  : "text-ink-3 hover:text-ink-2"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-3 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold text-ink">
          {Math.round(g.current)}
        </span>
        <span
          className={cn(
            "text-sm font-semibold",
            deltaPositive ? "text-[#5FB87A]" : "text-[#E0625A]"
          )}
        >
          {deltaPositive ? "+" : ""}
          {g.deltaPct}%
        </span>
        <span className="text-xs text-ink-3">vs. periodo anterior</span>
      </div>
      <LineTrend
        points={g.points.map((p) => ({ date: p.date, score: p.growthIndex }))}
        height={120}
        ariaLabel="Índice de crecimiento del equipo"
      />
    </Panel>
  );
}
