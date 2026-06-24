"use client";

import type { TeamInsightsFilters, GrowthGranularity } from "../types";
import { cn } from "@/shared/lib/cn";

interface FiltersBarProps {
  filters: TeamInsightsFilters;
  onChange: (filters: TeamInsightsFilters) => void;
  days: number;
  onDaysChange: (days: number) => void;
}

const RANGES = [
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
  { value: 180, label: "6m" },
  { value: 365, label: "1a" },
];

const SENTIMENTS = [
  { value: "", label: "Todos" },
  { value: "positive", label: "😊" },
  { value: "neutral", label: "😐" },
  { value: "risk", label: "☹️" },
];

export function FiltersBar({
  filters,
  onChange,
  days,
  onDaysChange,
}: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface px-3 py-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
        Rango
      </span>
      <div className="flex gap-1 rounded-button bg-white/[0.03] p-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onDaysChange(r.value)}
            className={cn(
              "rounded-button px-2 py-0.5 text-[11px] font-semibold transition-colors",
              days === r.value
                ? "bg-accent text-accent-ink"
                : "text-ink-3 hover:text-ink-2"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
        Sentimiento
      </span>
      <div className="flex gap-1 rounded-button bg-white/[0.03] p-1">
        {SENTIMENTS.map((s) => {
          const active =
            (filters.sentiment ?? "") === s.value ||
            (!filters.sentiment && s.value === "");
          return (
            <button
              key={s.value || "all"}
              type="button"
              onClick={() =>
                onChange({
                  ...filters,
                  sentiment: (s.value || undefined) as TeamInsightsFilters["sentiment"],
                })
              }
              className={cn(
                "rounded-button px-2 py-0.5 text-[12px] transition-colors",
                active ? "bg-accent text-accent-ink" : "text-ink-3 hover:text-ink-2"
              )}
              title={s.label}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <label className="ml-2 flex items-center gap-1.5 text-[11px] text-ink-3">
        <span className="uppercase tracking-[0.12em]">Seniority</span>
        <select
          value={filters.seniority ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              seniority: e.target.value || undefined,
            })
          }
          className="rounded-button border border-line bg-surface px-2 py-1 text-xs text-ink"
        >
          <option value="">Todas</option>
          <option value="junior">Junior</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
          <option value="lead">Lead</option>
        </select>
      </label>
    </div>
  );
}

export type { GrowthGranularity };
