"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/shared/ui";
import {
  useAnalyzeSmartGoal,
  useSaveSmartGoal,
} from "../hooks";
import type { SmartGoal } from "@/features/project-settings/domain/entities";
import {
  SMART_DIMENSIONS,
  SMART_LABELS,
  computeSmartScore,
  validateSmart,
} from "@/features/project-settings/application/smart";
import { SectionHeader, ScoreRing, Spinner, EmptyState } from "./primitives";
import type { SmartAnalysis } from "../services";

interface Props {
  workspaceId: string;
  smartGoal: SmartGoal | null;
}

type Draft = Record<(typeof SMART_DIMENSIONS)[number], string>;

function toDraft(g: SmartGoal | null): Draft {
  return {
    specific: g?.specific ?? "",
    measurable: g?.measurable ?? "",
    achievable: g?.achievable ?? "",
    relevant: g?.relevant ?? "",
    timeBound: g?.timeBound ?? "",
  };
}

export function SmartGoalEditor({ workspaceId, smartGoal }: Props) {
  const [title, setTitle] = useState(smartGoal?.title ?? "");
  const [draft, setDraft] = useState<Draft>(toDraft(smartGoal));
  const [deadline, setDeadline] = useState<string>(
    smartGoal?.deadline ? smartGoal.deadline.slice(0, 10) : ""
  );
  const [analysis, setAnalysis] = useState<SmartAnalysis | null>(null);

  const saveMutation = useSaveSmartGoal(workspaceId);
  const analyzeMutation = useAnalyzeSmartGoal(workspaceId);

  const liveScore = computeSmartScore({ ...draft, deadline });
  const checks = validateSmart(draft);

  const canSave = title.trim().length >= 2 && !saveMutation.isPending;

  const save = async () => {
    if (!canSave) return;
    await saveMutation.mutateAsync({
      title: title.trim(),
      specific: draft.specific.trim() || null,
      measurable: draft.measurable.trim() || null,
      achievable: draft.achievable.trim() || null,
      relevant: draft.relevant.trim() || null,
      timeBound: draft.timeBound.trim() || null,
      deadline: deadline ? new Date(deadline + "T12:00:00Z").toISOString() : null,
    });
    toast.success("Objetivo SMART guardado.");
  };

  const analyze = async () => {
    const res = await analyzeMutation.mutateAsync();
    setAnalysis(res.analysis);
    toast.success("Análisis de IA listo.");
  };

  return (
    <Card className="flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <SectionHeader
          title="Objetivo SMART"
          description="Define el objetivo que la IA usará para recomendaciones y seguimiento."
          hint='Ej: "Incrementar la adopción de usuarios en un 15% durante el Q3."'
        />
        <div className="flex flex-col items-center gap-1">
          <ScoreRing score={liveScore} />
          <span className="text-[10px] uppercase tracking-wider text-ink-3">Completitud</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
          Título del objetivo
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
          placeholder="¿Qué buscan lograr?"
          className="mt-2 w-full rounded-2xl border border-line-2 bg-surface px-4 py-3 text-ink outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {SMART_DIMENSIONS.map((dim) => (
          <div key={dim}>
            <label className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
              <span>{SMART_LABELS[dim].label}</span>
              <span
                className={
                  checks.find((c) => c.dimension === dim)?.ok
                    ? "text-sage"
                    : "text-glow"
                }
              >
                {checks.find((c) => c.dimension === dim)?.ok ? "✓" : "•"}
              </span>
            </label>
            <textarea
              value={draft[dim]}
              onChange={(e) => setDraft({ ...draft, [dim]: e.target.value })}
              placeholder={SMART_LABELS[dim].hint}
              rows={2}
              className="mt-2 w-full resize-none rounded-2xl border border-line-2 bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3 outline-none focus:border-accent"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
          Fecha límite (Time-bound)
        </label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="mt-2 rounded-2xl border border-line-2 bg-surface px-4 py-3 text-ink outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={analyze}
          disabled={analyzeMutation.isPending}
          icon="spark"
        >
          {analyzeMutation.isPending ? "Analizando…" : "Analizar con IA"}
        </Button>
        <Button size="sm" onClick={save} disabled={!canSave}>
          {saveMutation.isPending ? "Guardando…" : "Guardar objetivo"}
        </Button>
      </div>

      {analyzeMutation.isPending && <Spinner label="La IA está revisando tu objetivo…" />}

      {analysis && !analyzeMutation.isPending && (
        <div className="flex flex-col gap-3 rounded-2xl border border-glow-soft bg-glow-soft/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-3">
              Análisis IA · Puntaje
            </span>
            <ScoreRing score={analysis.score} size={40} />
          </div>
          <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
            {analysis.checks.map((c) => (
              <li key={c.dimension} className="flex gap-2">
                <span className={c.ok ? "text-sage" : "text-glow"}>{c.ok ? "✓" : "⚠"}</span>
                <span>
                  <strong className="text-ink">{SMART_LABELS[c.dimension].label}:</strong>{" "}
                  {c.feedback}
                </span>
              </li>
            ))}
          </ul>
          {analysis.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
                Sugerencias
              </p>
              <ul className="mt-1 list-disc pl-5 text-sm text-ink-2">
                {analysis.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!smartGoal && !analysis && (
        <EmptyState
          title="Aún no hay objetivo guardado"
          hint="Completa las 5 dimensiones SMART para que la IA pueda guiarte."
        />
      )}
    </Card>
  );
}
