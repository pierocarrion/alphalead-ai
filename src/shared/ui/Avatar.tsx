"use client";

import { cn } from "@/shared/lib/cn";

export type PersonId = "maya" | "daniel" | "sofia" | "theo" | "priya";

interface Person {
  name: string;
  initials: string;
  color: string;
  you: boolean;
}

export const PEOPLE: Record<PersonId, Person> = {
  maya: { name: "Maya", initials: "M", color: "#E6AC73", you: true },
  daniel: { name: "Daniel", initials: "D", color: "#9FB8E0", you: false },
  sofia: { name: "Sofía", initials: "S", color: "#E6A0B0", you: false },
  theo: { name: "Theo", initials: "T", color: "#93C2A2", you: false },
  priya: { name: "Priya", initials: "P", color: "#C7A6E0", you: false },
};

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amount;
  let g = ((n >> 8) & 255) + amount;
  let b = (n & 255) + amount;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

interface AvatarProps {
  who?: PersonId;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Avatar({ who = "daniel", size = 38, className, style }: AvatarProps) {
  const person = PEOPLE[who] ?? PEOPLE.daniel;
  return (
    <div
      className={cn(
        "flex flex-none items-center justify-center rounded-full font-display font-semibold text-[#1a1620]",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(150deg, ${person.color}, ${shade(person.color, -18)})`,
        ...style,
      }}
    >
      {person.initials}
    </div>
  );
}
