import type { TeamAlert, AlertThresholds } from "../entities/Alert";
import { DEFAULT_THRESHOLDS } from "../entities/Alert";
import type { WorkloadPoint } from "../entities/Workload";
import type { PsychologicalSafety } from "../entities/PsychologicalSafety";
import type { ProductivityRisk } from "../entities/ProductivityRisk";
import type { LearningActivity } from "../entities/Learning";
import type { EmployeeWithMetrics } from "../entities/Employee";
import { daysBetween } from "./dates";

export interface DetectAlertsInput {
  members: EmployeeWithMetrics[];
  workload: WorkloadPoint[];
  safety: PsychologicalSafety;
  risk: ProductivityRisk;
  learning: LearningActivity[];
  surveyDatesByMember?: Record<string, Date>;
  now?: Date;
  thresholds?: Partial<AlertThresholds>;
}

export function detectAlerts(input: DetectAlertsInput): TeamAlert[] {
  const t: AlertThresholds = { ...DEFAULT_THRESHOLDS, ...input.thresholds };
  const now = input.now ?? new Date();
  const alerts: TeamAlert[] = [];

  const loadByEmployee = new Map(
    input.workload.map((w) => [w.employeeId, w])
  );

  for (const member of input.members) {
    const load = loadByEmployee.get(member.employeeId);
    if (load && load.occupationPct > t.overloadPct) {
      alerts.push({
        id: `overload:${member.employeeId}`,
        severity: "critical",
        type: "overload",
        employeeId: member.employeeId,
        employeeName: member.name,
        message: `${member.name} está al ${Math.round(
          load.occupationPct
        )}% de capacidad (umbral ${t.overloadPct}%).`,
        value: load.occupationPct,
        threshold: t.overloadPct,
        createdAt: now.toISOString(),
      });
    }
  }

  if (input.safety.score < t.safetyCritical) {
    alerts.push({
      id: "safety:team",
      severity: "critical",
      type: "emotional_risk",
      employeeId: null,
      employeeName: null,
      message: `Psychological Safety del equipo en ${Math.round(
        input.safety.score
      )} (crítico < ${t.safetyCritical}).`,
      value: input.safety.score,
      threshold: t.safetyCritical,
      createdAt: now.toISOString(),
    });
  }

  for (const member of input.members) {
    if (member.sentimentScore < t.safetyCritical) {
      alerts.push({
        id: `emotional:${member.employeeId}`,
        severity: "warning",
        type: "emotional_risk",
        employeeId: member.employeeId,
        employeeName: member.name,
        message: `Posible riesgo emocional para ${member.name} (sentiment ${Math.round(
          member.sentimentScore
        )}).`,
        value: member.sentimentScore,
        threshold: t.safetyCritical,
        createdAt: now.toISOString(),
      });
    }
  }

  const learningByEmployee = groupBy(input.learning, (l) => l.employeeId);
  for (const member of input.members) {
    const activities = learningByEmployee.get(member.id) ?? [];
    const last = activities
      .filter((a) => a.completedAt)
      .sort((a, b) => (b.completedAt!.getTime() - a.completedAt!.getTime()))[0];
    if (!last || daysBetween(last.completedAt!, now) > t.stagnationDays) {
      alerts.push({
        id: `stagnation:${member.employeeId}`,
        severity: "warning",
        type: "stagnation",
        employeeId: member.employeeId,
        employeeName: member.name,
        message: `${member.name} no registra aprendizaje completado en los últimos ${t.stagnationDays} días.`,
        threshold: t.stagnationDays,
        createdAt: now.toISOString(),
      });
    }
  }

  if (input.risk.score > t.productivityHigh) {
    alerts.push({
      id: "risk:team",
      severity: "critical",
      type: "productivity_risk",
      employeeId: null,
      employeeName: null,
      message: `Riesgo de productividad del equipo en ${Math.round(
        input.risk.score
      )} (alto > ${t.productivityHigh}).`,
      value: input.risk.score,
      threshold: t.productivityHigh,
      createdAt: now.toISOString(),
    });
  }

  return severityOrder(alerts);
}

function severityOrder(alerts: TeamAlert[]): TeamAlert[] {
  const weight: Record<TeamAlert["severity"], number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  return [...alerts].sort((a, b) => weight[a.severity] - weight[b.severity]);
}

function groupBy<T, K>(items: T[], key: (t: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k) ?? [];
    list.push(item);
    map.set(k, list);
  }
  return map;
}
