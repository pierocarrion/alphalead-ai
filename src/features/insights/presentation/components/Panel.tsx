"use client";

import { cn } from "@/shared/lib/cn";

export function Panel({
  title,
  kicker,
  action,
  children,
  className,
}: {
  title?: string;
  kicker?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-card border border-line bg-surface p-5",
        className
      )}
    >
      {(title || kicker || action) && (
        <header className="mb-4 flex items-baseline justify-between gap-3">
          <div>
            {kicker && (
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
                {kicker}
              </p>
            )}
            {title && (
              <h3 className="font-display text-base font-semibold text-ink">
                {title}
              </h3>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PanelSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="mb-4 flex flex-col gap-2">
        <div className="h-3 w-24 animate-pulse rounded bg-line-2/60" />
        <div className="h-4 w-40 animate-pulse rounded bg-line-2/60" />
      </div>
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-full animate-pulse rounded-md bg-line-2/40"
            style={{ opacity: 1 - i * 0.12 }}
          />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  message,
  icon,
}: {
  message: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-2 px-6 py-10 text-center">
      {icon}
      <p className="max-w-xs text-sm text-ink-3 text-wrap-pretty">{message}</p>
    </div>
  );
}

export function StatChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass = {
    default: "bg-white/[0.03] text-ink-2",
    good: "bg-[#5FB87A]/10 text-[#5FB87A]",
    warn: "bg-[#E6B45A]/10 text-[#E6B45A]",
    bad: "bg-[#E0625A]/10 text-[#E0625A]",
  }[tone];
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-button px-3 py-2",
        toneClass
      )}
    >
      <span className="font-display text-lg font-bold leading-none">{value}</span>
      <span className="text-[10px] uppercase tracking-[0.12em] opacity-80">
        {label}
      </span>
    </div>
  );
}
