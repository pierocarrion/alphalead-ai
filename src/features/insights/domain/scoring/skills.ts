import type { SkillCell, SkillGap, SkillLevel } from "../entities/Learning";
import { classifyRiskLevel } from "../entities/Alert";

const LEVEL_RANK: Record<SkillLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

export function uniqueSkills(cells: SkillCell[]): string[] {
  const set = new Set<string>();
  for (const c of cells) set.add(c.skill);
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function buildSkillGaps(
  cells: SkillCell[],
  headcount: number,
  dependencyThreshold = 1
): SkillGap[] {
  const skills = uniqueSkills(cells);
  return skills.map((skill) => {
    const holders = cells.filter((c) => c.skill === skill);
    const experts = holders.filter(
      (c) => LEVEL_RANK[c.level] >= LEVEL_RANK.advanced
    ).length;
    const holdersCount = holders.length;
    const coverage = headcount > 0 ? holdersCount / headcount : 0;

    const riskScore = clampScore(
      (1 - coverage) * 60 + (experts <= dependencyThreshold ? 40 : 0)
    );
    const riskLevel = classifyRiskLevel(riskScore);

    return {
      skill,
      holders: holdersCount,
      experts,
      riskLevel,
      recommendation: recommend(skill, holdersCount, experts, headcount),
    };
  });
}

function recommend(
  skill: string,
  holders: number,
  experts: number,
  headcount: number
): string {
  if (experts === 0) {
    return `Nadie alcanzó nivel avanzado en ${skill}. Prioriza capacitación o contratación.`;
  }
  if (holders <= 1) {
    return `Dependencia crítica: solo ${holders} persona domina ${skill}. Forma al menos a otro integrante.`;
  }
  const coverage = headcount > 0 ? Math.round((holders / headcount) * 100) : 0;
  return `Cobertura de ${skill}: ${coverage}% del equipo. Refuerza con práctica guiada.`;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
