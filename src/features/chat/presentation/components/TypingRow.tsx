"use client";

import { Avatar, type PersonId } from "@/shared/ui";

interface TypingRowProps {
  who: PersonId;
}

export function TypingRow({ who }: TypingRowProps) {
  return (
    <div className="mb-3.5 flex items-center gap-3">
      <Avatar who={who} size={38} />
      <div
        className="flex gap-1 bg-surface p-3.5"
        style={{ borderRadius: "6px 18px 18px 18px", border: "1px solid var(--color-line)" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-1.5 w-1.5 rounded-full bg-ink-3"
            style={{
              animation: "typing-dot 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
