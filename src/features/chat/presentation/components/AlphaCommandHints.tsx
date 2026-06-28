"use client";

import { Alpha, Icon } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useLocale } from "@/i18n/useLocale";
import { t } from "@/i18n/messages";

interface AlphaCommandHint {
  key: string;
  label: string;
  /** Text inserted into the composer when the chip is clicked. */
  insert: string;
  icon: "spark" | "alert" | "check" | "compass" | "target" | "search";
}

interface AlphaCommandHintsProps {
  /** Called with the command text to insert into the composer draft. */
  onPick: (text: string) => void;
  /** Called when the user dismisses the hints banner. */
  onDismiss: () => void;
}

export function AlphaCommandHints({ onPick, onDismiss }: AlphaCommandHintsProps) {
  const [locale] = useLocale();
  const tr = (k: string) => t(locale, k);

  const commands: AlphaCommandHint[] = [
    { key: "summary", label: tr("chat.alphaHintSummary"), insert: "@alpha resume esta conversación", icon: "spark" },
    { key: "risks", label: tr("chat.alphaHintRisks"), insert: "@alpha identifica riesgos", icon: "alert" },
    { key: "tasks", label: tr("chat.alphaHintTasks"), insert: "@alpha crea tareas pendientes", icon: "check" },
    { key: "retro", label: tr("chat.alphaHintRetro"), insert: "@alpha genera una retrospectiva", icon: "compass" },
    { key: "strategy", label: tr("chat.alphaHintStrategy"), insert: "@alpha crea una estrategia comercial", icon: "target" },
    { key: "fetch", label: tr("chat.alphaHintFetch"), insert: "@alpha fetch: ", icon: "search" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-line-2 bg-surface px-2.5 py-2">
      <div className="flex items-center gap-1.5 pr-1">
        <Alpha size={20} mood="calm" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-3">
          {tr("chat.alphaHintsTitle")}
        </span>
      </div>
      {commands.map((cmd) => (
        <button
          key={cmd.key}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(cmd.insert);
          }}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-line bg-bg px-2.5 py-1",
            "text-[12px] font-semibold text-ink-2 transition-colors hover:border-accent hover:bg-accent-soft hover:text-ink"
          )}
        >
          <Icon name={cmd.icon} size={12} color="var(--color-accent)" />
          {cmd.label}
        </button>
      ))}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onDismiss();
        }}
        className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink"
        aria-label="Dismiss"
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
