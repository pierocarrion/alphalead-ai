"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { METHODOLOGIES } from "@/features/project-settings/domain/catalog";
import type { ProjectMethodologySelection } from "@/features/project-settings/domain/entities";
import { useSetMethodology } from "../hooks";
import { SectionHeader } from "./primitives";

interface Props {
  workspaceId: string;
  methodologies: ProjectMethodologySelection[];
}

export function MethodologyPicker({ workspaceId, methodologies }: Props) {
  const primary = methodologies.find((m) => m.tier === "primary")?.methodologyKey ?? null;
  const secondary = methodologies
    .filter((m) => m.tier === "secondary")
    .map((m) => m.methodologyKey);

  const [primaryDraft, setPrimaryDraft] = useState<string | null>(primary);
  const [secondaryDraft, setSecondaryDraft] = useState<string[]>(secondary);
  const [confirmChange, setConfirmChange] = useState<string | null>(null);

  const mutation = useSetMethodology(workspaceId);

  const dirty =
    primaryDraft !== primary ||
    JSON.stringify([...secondaryDraft].sort()) !== JSON.stringify([...secondary].sort());

  const toggleSecondary = (key: string) => {
    if (key === primaryDraft) return;
    setSecondaryDraft((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const choosePrimary = (key: string) => {
    if (primary && key !== primary) {
      setConfirmChange(key);
      return;
    }
    setPrimaryDraft(key);
    setSecondaryDraft((prev) => prev.filter((k) => k !== key));
  };

  const applyPrimaryChange = async () => {
    if (confirmChange) {
      setPrimaryDraft(confirmChange);
      setSecondaryDraft((prev) => prev.filter((k) => k !== confirmChange));
      setConfirmChange(null);
    }
  };

  const save = async () => {
    if (!primaryDraft) {
      toast.error("Elige una metodología principal.");
      return;
    }
    await mutation.mutateAsync({ primary: primaryDraft, secondary: secondaryDraft });
    toast.success("Metodología guardada.");
  };

  return (
    <Card className="flex flex-col gap-5 p-5">
      <SectionHeader
        title="Metodología de trabajo"
        description="Una metodología principal y tantas secundarias como quieras."
        hint="La IA adapta recomendaciones según tu stack metodológico."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {METHODOLOGIES.map((m) => {
          const isPrimary = primaryDraft === m.key;
          const isSecondary = secondaryDraft.includes(m.key);
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => choosePrimary(m.key)}
              className={cn(
                "flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all",
                isPrimary
                  ? "border-accent bg-accent-soft"
                  : isSecondary
                  ? "border-sage/60 bg-sage-soft/40"
                  : "border-line bg-surface-2 hover:bg-surface-3"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{m.emoji}</span>
                {isPrimary ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-ink">
                    PRINCIPAL
                  </span>
                ) : isSecondary ? (
                  <span className="rounded-full bg-sage px-2 py-0.5 text-[10px] font-bold text-bg">
                    SECUNDARIA
                  </span>
                ) : null}
              </div>
              <span className="font-display text-base text-ink">{m.name}</span>
              <span className="text-[12.5px] text-ink-2">{m.description}</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {m.benefits.slice(0, 2).map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-line px-2 py-0.5 text-[10.5px] text-ink-3"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <p className="pt-1 text-[11.5px] text-glow">✨ {m.aiHint}</p>

              {!isPrimary && (
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSecondary(m.key);
                  }}
                  className="mt-1 self-start text-[11px] font-semibold text-ink-3 hover:text-ink"
                >
                  {isSecondary ? "Quitar secundaria" : "+ Añadir como secundaria"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {confirmChange && (
        <div className="rounded-2xl border border-glow-soft bg-glow-soft/30 p-3 text-sm text-ink-2">
          Cambiar la metodología principal puede reorientar las recomendaciones de la IA. ¿Continuar?{" "}
          <button
            type="button"
            onClick={applyPrimaryChange}
            className="ml-2 font-semibold text-ink underline"
          >
            Sí, cambiar
          </button>
          <button
            type="button"
            onClick={() => setConfirmChange(null)}
            className="ml-2 text-ink-3 underline"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || mutation.isPending}
          className="rounded-button bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-50"
        >
          {mutation.isPending ? "Guardando…" : "Guardar metodología"}
        </button>
      </div>
    </Card>
  );
}
