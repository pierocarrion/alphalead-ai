"use client";

import type { TeamAlert, TeamInsight } from "../types";
import { Panel, EmptyState } from "./Panel";
import { cn } from "@/shared/lib/cn";

const SEVERITY_STYLE: Record<
  TeamAlert["severity"],
  { dot: string; label: string }
> = {
  critical: { dot: "#E0625A", label: "Crítico" },
  warning: { dot: "#E6B45A", label: "Atención" },
  info: { dot: "#73B8E6", label: "Info" },
};

const TONE_STYLE: Record<TeamInsight["tone"], { emoji: string; label: string }> =
  {
    celebration: { emoji: "\u{1F389}", label: "Celebrar" },
    opportunity: { emoji: "\u{1F4A1}", label: "Oportunidad" },
    caution: { emoji: "\u{26A0}\u{FE0F}", label: "Cuidado" },
  };

export function AlertsPanel({ alerts }: { alerts: TeamAlert[] }) {
  return (
    <Panel kicker="Alertas inteligentes" title="Señales que atender">
      {alerts.length === 0 ? (
        <EmptyState message="Todo en calma. No hay alertas activas en este periodo." />
      ) : (
        <ul className="flex flex-col gap-2">
          {alerts.map((a) => {
            const style = SEVERITY_STYLE[a.severity];
            return (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-card border border-line p-3"
              >
                <span
                  className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: style.dot }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-2 text-wrap-pretty">
                    {a.message}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-ink-3">
                    {style.label}
                    {a.employeeName ? ` · ${a.employeeName}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function InsightsPanel({ insights }: { insights: TeamInsight[] }) {
  return (
    <Panel kicker="Recomendaciones IA" title="Insights automáticos">
      {insights.length === 0 ? (
        <EmptyState message="A medida que el equipo genere actividad, aquí aparecerán recomendaciones." />
      ) : (
        <ul className="flex flex-col gap-2">
          {insights.map((insight) => {
            const tone = TONE_STYLE[insight.tone];
            return (
              <li
                key={insight.id}
                className={cn(
                  "flex items-start gap-3 rounded-card border p-3",
                  insight.tone === "caution"
                    ? "border-[#E6B45A]/30 bg-[#E6B45A]/[0.04]"
                    : insight.tone === "celebration"
                    ? "border-[#5FB87A]/30 bg-[#5FB87A]/[0.05]"
                    : "border-line"
                )}
              >
                <span className="text-base leading-none" aria-hidden>
                  {tone.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{insight.title}</p>
                  <p className="mt-0.5 text-xs text-ink-3 text-wrap-pretty">
                    {insight.detail}
                  </p>
                  <span className="mt-1 inline-block text-[10px] uppercase tracking-[0.12em] text-ink-3">
                    {tone.label} · {insight.category}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
