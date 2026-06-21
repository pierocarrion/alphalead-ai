"use client";

import { cn } from "@/shared/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface p-[calc(18px*var(--d,1))]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
