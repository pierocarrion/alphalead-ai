import type { TeamInsight } from "../entities/Insight";
import type { EmployeeWithMetrics } from "../entities/Employee";
import type { WorkloadPoint } from "../entities/Workload";
import type { LearningActivity, SkillCell, SkillGap } from "../entities/Learning";

export interface GenerateInsightsInput {
  members: EmployeeWithMetrics[];
  workload: WorkloadPoint[];
  learning: LearningActivity[];
  skills: SkillCell[];
  skillGaps: SkillGap[];
  safetyScore: number;
  safetyHasData: boolean;
  riskScore: number;
  sinceDays: number;
}

export function generateInsights(input: GenerateInsightsInput): TeamInsight[] {
  const insights: TeamInsight[] = [];

  const avgOccupation =
    input.workload.length > 0
      ? input.workload.reduce((a, w) => a + w.occupationPct, 0) /
        input.workload.length
      : 0;

  for (const w of input.workload) {
    if (avgOccupation > 0) {
      const diff = ((w.occupationPct - avgOccupation) / avgOccupation) * 100;
      if (diff >= 25) {
        insights.push({
          id: `insight:overload:${w.employeeId}`,
          category: "workload",
          tone: "caution",
          title: `Carga desbalanceada`,
          detail: `${w.name} tiene una carga ${Math.round(
            diff
          )}% superior al promedio del equipo. Considera redistribuir tareas.`,
          subject: { kind: "employee", ref: w.employeeId },
        });
      }
    }
  }

  const learningByEmployee = new Map<string, LearningActivity[]>();
  for (const l of input.learning) {
    const list = learningByEmployee.get(l.employeeId) ?? [];
    list.push(l);
    learningByEmployee.set(l.employeeId, list);
  }

  for (const member of input.members) {
    const certs = (learningByEmployee.get(member.id) ?? []).filter(
      (l) => l.type === "certification" && l.completedAt
    );
    if (certs.length >= 3) {
      insights.push({
        id: `insight:certs:${member.id}`,
        category: "growth",
        tone: "celebration",
        title: `${member.name} suma ${certs.length} certificaciones`,
        detail: `${member.name} ha completado ${certs.length} certificaciones y podría asumir nuevas responsabilidades.`,
        subject: { kind: "employee", ref: member.id },
      });
    }
  }

  for (const gap of input.skillGaps) {
    if (gap.riskLevel === "high") {
      insights.push({
        id: `insight:skill:${gap.skill}`,
        category: "skills",
        tone: "caution",
        title: `Dependencia crítica en ${gap.skill}`,
        detail: gap.recommendation,
        subject: { kind: "skill", ref: gap.skill },
      });
    }
  }

  if (input.safetyHasData && input.safetyScore < 50) {
    insights.push({
      id: "insight:safety",
      category: "wellbeing",
      tone: "caution",
      title: "Bienestar del equipo requiere atención",
      detail: `El Psychological Safety está en ${Math.round(
        input.safetyScore
      )}. Refuerza espacios de escucha y reconocimiento.`,
      subject: { kind: "team", ref: "team" },
    });
  }

  return insights;
}
