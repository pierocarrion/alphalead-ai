"use client";

import { useMemo, useState } from "react";
import type { TeamOverview, SkillLevel } from "../types";
import { Panel, EmptyState, StatChip } from "./Panel";
import { cn } from "@/shared/lib/cn";

const LEVEL_ORDER: SkillLevel[] = ["beginner", "intermediate", "advanced", "expert"];
const LEVEL_LABEL: Record<SkillLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};
const LEVEL_BG: Record<SkillLevel, string> = {
  beginner: "rgba(230,180,90,0.25)",
  intermediate: "rgba(95,184,122,0.3)",
  advanced: "rgba(95,184,122,0.6)",
  expert: "rgba(95,184,122,0.95)",
};

export function SkillsMatrixPanel({ overview }: { overview: TeamOverview }) {
  const { skillsMatrix, skillGaps, learningKpis } = overview;
  const [tab, setTab] = useState<"matrix" | "gaps" | "kpis">("matrix");

  const { members, skills, grid } = useMemo(() => {
    const memberMap = new Map<string, string>();
    for (const c of skillsMatrix) memberMap.set(c.employeeId, c.employeeName);
    const memberList = Array.from(memberMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));
    const skillList = Array.from(new Set(skillsMatrix.map((c) => c.skill))).sort();
    const lookup = new Map<string, SkillLevel>();
    for (const c of skillsMatrix) lookup.set(`${c.employeeId}:${c.skill}`, c.level);
    return {
      members: memberList,
      skills: skillList,
      grid: lookup,
    };
  }, [skillsMatrix]);

  return (
    <Panel
      kicker="Learning Analytics"
      title="Skills Matrix & Skill Gaps"
      action={
        <div className="flex gap-1 rounded-button bg-white/[0.03] p-1">
          {(["matrix", "gaps", "kpis"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-button px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors",
                tab === t
                  ? "bg-accent text-accent-ink"
                  : "text-ink-3 hover:text-ink-2"
              )}
            >
              {t === "kpis" ? "KPIs" : t}
            </button>
          ))}
        </div>
      }
    >
      {tab === "matrix" &&
        (members.length === 0 || skills.length === 0 ? (
          <EmptyState message="Registra skills para tus colaboradores para ver la matriz." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-surface text-left text-[10px] uppercase tracking-[0.12em] text-ink-3">
                    Colaborador
                  </th>
                  {skills.map((s) => (
                    <th
                      key={s}
                      className="px-1 text-[10px] font-semibold text-ink-3"
                      title={s}
                    >
                      <span className="block max-w-[64px] truncate">{s}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap py-1 pr-2 text-ink-2">
                      {m.name}
                    </td>
                    {skills.map((s) => {
                      const level = grid.get(`${m.id}:${s}`);
                      return (
                        <td key={s} className="p-0">
                          <div
                            className="h-6 min-w-[28px] rounded-md text-center text-[9px] font-bold leading-6 text-ink"
                            style={{
                              background: level ? LEVEL_BG[level] : "var(--color-line-2)",
                              opacity: level ? 1 : 0.4,
                            }}
                            title={level ? LEVEL_LABEL[level] : "Sin registro"}
                          >
                            {level ? level.charAt(0).toUpperCase() : "·"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex flex-wrap gap-2">
              {LEVEL_ORDER.map((l) => (
                <span
                  key={l}
                  className="flex items-center gap-1 text-[10px] text-ink-3"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: LEVEL_BG[l] }}
                  />
                  {LEVEL_LABEL[l]}
                </span>
              ))}
            </div>
          </div>
        ))}

      {tab === "gaps" &&
        (skillGaps.length === 0 ? (
          <EmptyState message="No hay skills registradas para analizar brechas." />
        ) : (
          <div className="flex flex-col gap-2">
            {skillGaps
              .slice()
              .sort((a, b) => {
                const order = { high: 0, moderate: 1, low: 2 };
                return order[a.riskLevel] - order[b.riskLevel];
              })
              .map((gap) => (
                <div
                  key={gap.skill}
                  className="rounded-card border border-line p-3"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-ink-2">{gap.skill}</span>
                    <StatChip
                      label="Cobertura"
                      value={`${gap.holders}`}
                      tone={
                        gap.riskLevel === "high"
                          ? "bad"
                          : gap.riskLevel === "moderate"
                          ? "warn"
                          : "good"
                      }
                    />
                  </div>
                  <p className="mt-2 text-xs text-ink-3 text-wrap-pretty">
                    {gap.recommendation}
                  </p>
                </div>
              ))}
          </div>
        ))}

      {tab === "kpis" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatChip label="Iniciados" value={learningKpis.coursesStarted} />
          <StatChip
            label="Completados"
            value={learningKpis.coursesCompleted}
            tone="good"
          />
          <StatChip label="Horas" value={Math.round(learningKpis.learningHours)} />
          <StatChip
            label="Certificaciones"
            value={learningKpis.certifications}
            tone="good"
          />
        </div>
      )}
    </Panel>
  );
}
