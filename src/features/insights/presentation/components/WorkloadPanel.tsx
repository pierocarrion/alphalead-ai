"use client";

import type { TeamOverview } from "../types";
import { Panel, StatChip, EmptyState } from "./Panel";
import { BarList, Heatmap } from "./charts";

const STATUS_LABEL: Record<string, string> = {
  balanced: "Balanceado",
  moderate: "Riesgo moderado",
  overload: "Sobrecarga",
};

export function WorkloadPanel({ overview }: { overview: TeamOverview }) {
  const { workload } = overview;
  const items = workload.points
    .slice()
    .sort((a, b) => b.occupationPct - a.occupationPct)
    .slice(0, 8);

  const max = Math.max(workload.averageOccupationPct * 1.3, 120, ...items.map((i) => i.occupationPct));

  const heatmapRows = items.map((p) => ({
    label: p.name,
    cells: [{ value: p.occupationPct, label: "Ocupación" }],
  }));

  return (
    <Panel
      kicker="Workload Balance"
      title="Distribución de la carga"
      action={
        <div className="flex gap-1.5">
          <StatChip
            label="Promedio"
            value={`${Math.round(workload.averageOccupationPct)}%`}
            tone={
              workload.averageOccupationPct > 120
                ? "bad"
                : workload.averageOccupationPct > 85
                ? "warn"
                : "good"
            }
          />
          <StatChip
            label="Sobrecarga"
            value={workload.overloadedCount}
            tone={workload.overloadedCount > 0 ? "bad" : "good"}
          />
        </div>
      }
    >
      {items.length === 0 ? (
        <EmptyState message="Aún no hay tareas asignadas en el rango seleccionado." />
      ) : (
        <div className="flex flex-col gap-5">
          <BarList
            items={items.map((p) => ({
              label: p.name,
              value: p.occupationPct,
              max,
              detail: `${p.totalTasks} tareas · ${STATUS_LABEL[p.status]}`,
              color:
                p.status === "overload"
                  ? "#E0625A"
                  : p.status === "moderate"
                  ? "#E6B45A"
                  : "#5FB87A",
            }))}
          />
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
              Heatmap de ocupación
            </p>
            <Heatmap rows={heatmapRows} max={120} />
          </div>
        </div>
      )}
    </Panel>
  );
}
