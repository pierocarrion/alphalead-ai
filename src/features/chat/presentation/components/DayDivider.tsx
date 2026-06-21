"use client";

interface DayDividerProps {
  label: string;
}

export function DayDivider({ label }: DayDividerProps) {
  return (
    <div className="my-3 flex items-center gap-2.5">
      <div className="h-px flex-1 bg-line" />
      <span className="text-xs text-ink-3">{label}</span>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}
