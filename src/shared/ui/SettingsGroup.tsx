"use client";

import { Icon, type IconName } from "./Icon";

interface SettingsGroupProps {
  label: string;
  note?: string;
  children: React.ReactNode;
}

export function SettingsGroup({ label, note, children }: SettingsGroupProps) {
  return (
    <div className="mb-5">
      <div className="px-1.5 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
        {label}
      </div>
      <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
        {children}
      </div>
      {note && <p className="px-1.5 pt-2 text-xs text-ink-3 text-wrap-pretty">{note}</p>}
    </div>
  );
}

interface SettingRowProps {
  title: string;
  detail?: string;
  tint?: string;
  icon?: IconName;
  chevron?: boolean;
  plus?: boolean;
  last?: boolean;
}

export function SettingRow({ title, detail, tint, icon, chevron, plus, last }: SettingRowProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${
        last ? "" : "border-b border-line"
      }`}
    >
      {icon && (
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-surface-2">
          <Icon name={icon} size={17} color={tint ?? "var(--color-ink-2)"} />
        </div>
      )}
      <span className="flex-1 text-[15.5px] text-ink">{title}</span>
      {detail && <span className="text-xs" style={{ color: tint ?? "var(--color-ink-3)" }}>{detail}</span>}
      {chevron && <Icon name="arrow" size={16} color="var(--color-ink-3)" />}
      {plus && <Icon name="plus" size={18} color="var(--color-accent)" />}
    </div>
  );
}

interface SettingRowToggleProps {
  title: string;
  on: boolean;
  onToggle: () => void;
  last?: boolean;
}

export function SettingRowToggle({ title, on, onToggle, last }: SettingRowToggleProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${
        last ? "" : "border-b border-line"
      }`}
    >
      <span className="flex-1 text-[15.5px] text-ink">{title}</span>
      <button
        onClick={onToggle}
        aria-label={title}
        className="relative h-7 w-12 rounded-full border-0 p-[3px] transition-colors"
        style={{ background: on ? "var(--color-accent)" : "var(--color-surface-3)" }}
      >
        <span
          className="block h-[22px] w-[22px] rounded-full bg-white shadow transition-transform"
          style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}
