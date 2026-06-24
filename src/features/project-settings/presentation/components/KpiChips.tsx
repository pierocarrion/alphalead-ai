"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/shared/ui";
import { KPI_CATALOG } from "@/features/project-settings/domain/catalog";
import type { ProjectKpi } from "@/features/project-settings/domain/entities";
import { useSetKpis } from "../hooks";
import { Chip, SectionHeader, Spinner, Toggle } from "./primitives";

interface Props {
  workspaceId: string;
  kpis: ProjectKpi[];
}

interface DraftEntry {
  kpiKey: string;
  enabled: boolean;
  target: string;
  alertThreshold: string;
}

export function KpiChips({ workspaceId, kpis }: Props) {
  const mutation = useSetKpis(workspaceId);

  const initial = useMemo<Record<string, DraftEntry>>(() => {
    const map: Record<string, DraftEntry> = {};
    for (const kpi of KPI_CATALOG) {
      const existing = kpis.find((k) => k.kpiKey === kpi.key);
      map[kpi.key] = {
        kpiKey: kpi.key,
        enabled: existing?.enabled ?? false,
        target: existing?.target != null ? String(existing.target) : "",
        alertThreshold: existing?.alertThreshold != null ? String(existing.alertThreshold) : "",
      };
    }
    return map;
  }, [kpis]);

  const [draft, setDraft] = useState(initial);
  const [historyFor, setHistoryFor] = useState<string | null>(null);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initial),
    [draft, initial]
  );

  const update = (key: string, patch: Partial<DraftEntry>) =>
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const save = async () => {
    const entries = Object.values(draft).map((e) => ({
      kpiKey: e.kpiKey,
      enabled: e.enabled,
      target: e.target.trim() ? Number(e.target) : null,
      alertThreshold: e.alertThreshold.trim() ? Number(e.alertThreshold) : null,
    }));
    try {
      await mutation.mutateAsync(entries);
      toast.success("KPIs actualizados.");
    } catch {
      /* handled */
    }
  };

  const activeCount = Object.values(draft).filter((e) => e.enabled).length;
  const historyKpi = kpis.find((k) => k.kpiKey === historyFor);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <SectionHeader
        title="KPIs del proyecto"
        description="Activa los indicadores que la IA seguirá. Configura metas y alertas."
        hint={`${activeCount} de ${KPI_CATALOG.length} KPIs activos.`}
      />

      <div className="flex flex-wrap gap-2">
        {KPI_CATALOG.map((kpi) => {
          const e = draft[kpi.key];
          const enabled = e.enabled;
          return (
            <button
              key={kpi.key}
              type="button"
              onClick={() => setHistoryFor(historyFor === kpi.key ? null : kpi.key)}
              className={cnChip(enabled)}
            >
              {kpi.name}
              <span
                role="switch"
                aria-checked={enabled}
                onClick={(ev) => {
                  ev.stopPropagation();
                  update(kpi.key, { enabled: !enabled });
                }}
                className={
                  "ml-2 inline-flex h-4 w-7 items-center rounded-full transition-colors " +
                  (enabled ? "bg-accent" : "bg-surface-3")
                }
              >
                <span
                  className={
                    "h-3 w-3 rounded-full bg-bg transition-all " +
                    (enabled ? "translate-x-3.5" : "translate-x-0.5")
                  }
                />
              </span>
            </button>
          );
        })}
      </div>

      {historyFor && (
        <div className="rounded-2xl border border-line bg-surface-2 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">
                {KPI_CATALOG.find((k) => k.key === historyFor)?.name}
              </p>
              <p className="text-[12px] text-ink-3">
                {KPI_CATALOG.find((k) => k.key === historyFor)?.formula} ·{" "}
                {KPI_CATALOG.find((k) => k.key === historyFor)?.frequency}
              </p>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-ink-3">Tendencia</span>
          </div>
          {historyKpi && historyKpi.snapshots.length > 0 ? (
            <Sparkline
              points={historyKpi.snapshots.map((s) => s.value)}
              labels={historyKpi.snapshots.map((s) => new Date(s.capturedAt).toLocaleDateString())}
            />
          ) : (
            <p className="mt-3 text-[12px] text-ink-3">
              Sin datos históricos todavía. Los snapshots se registran al calcular los KPIs.
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between gap-2 text-[12px] text-ink-2">
              Meta
              <input
                type="number"
                value={draft[historyFor].target}
                onChange={(ev) => update(historyFor, { target: ev.target.value })}
                className="w-24 rounded-lg border border-line-2 bg-surface px-2 py-1 text-right text-ink outline-none focus:border-accent"
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-[12px] text-ink-2">
              Alerta
              <input
                type="number"
                value={draft[historyFor].alertThreshold}
                onChange={(ev) => update(historyFor, { alertThreshold: ev.target.value })}
                className="w-24 rounded-lg border border-line-2 bg-surface px-2 py-1 text-right text-ink outline-none focus:border-accent"
              />
            </label>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] text-ink-3">
          <Toggle
            checked={Object.values(draft).every((e) => e.enabled)}
            onChange={(all) =>
              setDraft((prev) =>
                Object.fromEntries(
                  Object.entries(prev).map(([k, v]) => [k, { ...v, enabled: all }])
                ) as Record<string, DraftEntry>
              )
            }
          />
          Todos
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || mutation.isPending}
          className="rounded-button bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-50"
        >
          {mutation.isPending ? "Guardando…" : "Guardar KPIs"}
        </button>
      </div>

      {mutation.isPending && <Spinner label="Actualizando KPIs…" />}
    </Card>
  );
}

function cnChip(enabled: boolean) {
  return (
    "inline-flex items-center gap-2 rounded-full border-[1.5px] px-3 py-1.5 text-sm font-semibold transition-all " +
    (enabled
      ? "border-accent bg-accent-soft text-ink"
      : "border-line text-ink-2 hover:bg-surface-2")
  );
}

function Sparkline({ points, labels }: { points: number[]; labels: string[] }) {
  const w = 240;
  const h = 48;
  if (points.length < 2) {
    return <div className="mt-3 h-12" />;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => [i * step, h - ((p - min) / range) * h]);
  const d = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(" ");
  const last = labels[labels.length -1];
  const first = labels[0];
  return (
    <div className="mt-3">
      <svg width={w} height={h} className="overflow-visible">
        <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c[0]} cy={c[1]} r={2} fill="var(--color-accent)" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-ink-3">
        <span>{first}</span>
        <span>{last}</span>
      </div>
    </div>
  );
}

void Chip;
