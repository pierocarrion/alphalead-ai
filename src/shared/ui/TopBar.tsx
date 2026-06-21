"use client";

import { cn } from "@/shared/lib/cn";
import { Icon } from "./Icon";

interface TopBarProps {
  title?: string;
  kicker?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  className?: string;
}

export function TopBar({ title, kicker, onBack, trailing, className }: TopBarProps) {
  return (
    <div
      className={cn(
        "flex flex-none items-center gap-3 px-[18px] pb-2.5 pt-2 min-h-12",
        className
      )}
    >
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-line bg-white/[0.04]"
        >
          <Icon name="back" size={21} color="var(--color-ink-2)" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        {kicker && (
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
            {kicker}
          </div>
        )}
        {title && (
          <div className="font-display text-[19px] text-ink">{title}</div>
        )}
      </div>
      {trailing}
    </div>
  );
}
