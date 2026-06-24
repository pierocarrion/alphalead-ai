"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, Button } from "@/shared/ui";
import type { ProjectAiInsight } from "@/features/project-settings/domain/entities";
import { useRegenerateInsights } from "../hooks";
import { SectionHeader, Spinner, EmptyState } from "./primitives";
import type { AiInsightBundle } from "../services";

interface Props {
  workspaceId: string;
  insights: ProjectAiInsight[];
}

const TYPE_META: Record<ProjectAiInsight["type"], { label: string; color: string }> = {
  risk: { label: "Riesgo", color: "var(--color-glow)" },
  recommendation: { label: "Recomendación", color: "var(--color-accent)" },
  alert: { label: "Alerta", color: "var(--color-glow)" },
  action: { label: "Acción", color: "var(--color-sage)" },
  metric: { label: "Métrica", color: "var(--color-accent)" },
  workload: { label: "Distribución", color: "var(--color-sage)" },
};

export function AiInsightsPanel({ workspaceId, insights }: Props) {
  const [bundle, setBundle] = useState<AiInsightBundle | null>(null);
  const mutation = useRegenerateInsights(workspaceId);

  const regenerate = async () => {
    try {
      const res = await mutation.mutateAsync();
      setBundle(res.bundle);
      toast.success("Insights regenerados con IA.");
    } catch {
      /* handled */
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <SectionHeader
            title="Configuración inteligente IA"
            description="La IA analiza tu objetivo, metodología, equipo y KPIs para generar riesgos, recomendaciones y un plan de acción."
          />
          <Button size="sm" icon="spark" onClick={regenerate} disabled={mutation.isPending}>
            {mutation.isPending ? "Pensando…" : "Generar insights"}
          </Button>
        </div>
        {mutation.isPending && <Spinner label="La IA está analizando el proyecto…" />}
      </Card>

      {bundle && (
        <Card className="flex flex-col gap-4 p-5">
          <div>
            <h3 className="font-display text-base text-ink">Plan de acción sugerido</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-2">
              {bundle.actionPlan.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </div>

          {bundle.suggestedMetrics.length > 0 && (
            <div>
              <h3 className="font-display text-base text-ink">Métricas sugeridas</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {bundle.suggestedMetrics.map((m, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-line bg-surface-2 px-3 py-1 text-[12.5px] text-ink-2"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-display text-base text-ink">Distribución de trabajo recomendada</h3>
            <div className="mt-2 flex flex-col gap-2">
              {bundle.workloadDistribution.map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-40 text-[12.5px] text-ink-2">{w.role}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.max(4, Math.min(100, w.suggestedShare))}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-[12px] text-ink-3">{w.suggestedShare}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-3 p-5">
        <SectionHeader title="Insights guardados" description="Última generación de la IA." />
        {insights.length === 0 ? (
          <EmptyState
            title="Sin insights todavía"
            hint="Pulsa «Generar insights» para que la IA analice tu configuración."
          />
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {insights.map((ins) => {
              const meta = TYPE_META[ins.type] ?? TYPE_META.recommendation;
              return (
                <div
                  key={ins.id}
                  className="rounded-2xl border border-line bg-surface-2 p-3"
                  style={{ borderLeft: `3px solid ${meta.color}` }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: `${meta.color}22`, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    {ins.severity && (
                      <span className="text-[10px] uppercase text-ink-3">{ins.severity}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-ink">{ins.title}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-2">{ins.detail}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
