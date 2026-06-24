"use client";

import { cn } from "@/shared/lib/cn";

export function SectionHeader({
  title,
  description,
  hint,
}: {
  title: string;
  description?: string;
  hint?: string;
}) {
  return (
    <div>
      <h2 className="font-display text-lg text-ink">{title}</h2>
      {description && (
        <p className="mt-0.5 text-[13.5px] text-ink-2">{description}</p>
      )}
      {hint && <p className="mt-1 text-[12px] text-ink-3">{hint}</p>}
    </div>
  );
}

export function Chip({
  selected,
  onClick,
  children,
  disabled,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full border-[1.5px] px-3 py-1.5 text-sm font-semibold transition-all disabled:opacity-50",
        selected
          ? "border-accent bg-accent-soft text-ink"
          : "border-line text-ink-2 hover:bg-surface-2"
      )}
    >
      {children}
    </button>
  );
}

export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ;
  const color = score >= 80 ? "var(--color-sage)" : score >= 50 ? "var(--color-accent)" : "var(--color-glow)";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-line-2)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s var(--ease-out)" }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-ink">{Math.round(score)}</span>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-2 p-6 text-center">
      <p className="text-sm font-semibold text-ink-2">{title}</p>
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-ink-3">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-2 border-t-accent" />
      <span className="text-sm">{label ?? "Cargando…"}</span>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-accent" : "bg-surface-3"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-bg transition-all",
          checked ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-card border border-line bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg text-ink">{title}</h3>
          <button type="button" onClick={onClose} className="text-ink-3 hover:text-ink">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
