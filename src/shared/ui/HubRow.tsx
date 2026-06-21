"use client";

import Link from "next/link";
import { Icon, type IconName } from "./Icon";

interface HubRowProps {
  icon: IconName;
  tint: string;
  title: string;
  sub: string;
  href?: string;
  onClick?: () => void;
}

export function HubRow({ icon, tint, title, sub, href, onClick }: HubRowProps) {
  const content = (
    <>
      <div className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[13px] bg-surface-2">
        <Icon name={icon} size={21} color={tint} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-bold text-ink">{title}</div>
        <div className="text-xs text-ink-3">{sub}</div>
      </div>
      <Icon name="arrow" size={18} color="var(--color-ink-3)" />
    </>
  );

  const className =
    "flex w-full items-center gap-3.5 rounded-[20px] border border-line bg-surface p-4 text-left transition-colors hover:bg-surface-2";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}
