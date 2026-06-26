import { describe, it, expect } from "vitest";
import { detectAlerts } from "./alerts";
import type { EmployeeWithMetrics } from "../entities/Employee";
import type { WorkloadPoint } from "../entities/Workload";
import type { PsychologicalSafety } from "../entities/PsychologicalSafety";
import type { ProductivityRisk } from "../entities/ProductivityRisk";
import type { LearningActivity } from "../entities/Learning";

function member(id: string, sentimentScore = 70): EmployeeWithMetrics {
  return {
    id,
    name: id,
    photo: null,
    position: null,
    team: "t",
    role: "member",
    seniority: null,
    hireDate: null,
    employeeId: id,
    activeTasks: 0,
    completedTasks: 0,
    workedHours: 0,
    estimatedHours: 0,
    progressPct: 0,
    learningProgress: 0,
    sentimentScore,
    sentiment: sentimentScore >= 66 ? "positive" : sentimentScore >= 40 ? "neutral" : "risk",
    sentimentHasData: true,
  };
}

const safety = (score: number, hasData = true): PsychologicalSafety => ({
  score,
  status: score < 40 ? "critical" : score < 70 ? "moderate" : "healthy",
  hasData,
  trend: [],
  breakdown: { survey: 0, feedback: 0, participation: 0, sentiment: 0 },
});

const risk = (score: number): ProductivityRisk => ({
  score,
  level: score < 40 ? "low" : score < 70 ? "moderate" : "high",
  trend: [],
  breakdown: {
    overload: 0,
    overdue: 0,
    activityDecline: 0,
    lowParticipation: 0,
    taskMiss: 0,
    absenteeism: 0,
  },
});

function workload(
  id: string,
  occupationPct: number
): WorkloadPoint {
  return {
    employeeId: id,
    name: id,
    totalTasks: 1,
    estimatedHours: occupationPct * 0.4,
    workedHours: occupationPct * 0.4,
    capacityHours: 40,
    occupationPct,
    availableHours: Math.max(0, 40 - occupationPct * 0.4),
    status: occupationPct > 120 ? "overload" : occupationPct > 85 ? "moderate" : "balanced",
    overload: occupationPct > 120,
  };
}

describe("alerts", () => {
  const base = {
    members: [member("a"), member("b")],
    learning: [] as LearningActivity[],
    now: new Date("2025-01-31"),
  };

  it("flags overload above 120%", () => {
    const alerts = detectAlerts({
      ...base,
      workload: [workload("a", 140)],
      safety: safety(80),
      risk: risk(20),
    });
    expect(alerts.some((a) => a.type === "overload" && a.employeeId === "a")).toBe(true);
  });

  it("flags emotional team risk below threshold", () => {
    const alerts = detectAlerts({
      ...base,
      workload: [],
      safety: safety(30),
      risk: risk(20),
    });
    expect(alerts.some((a) => a.type === "emotional_risk" && a.employeeId === null)).toBe(true);
  });

  it("flags productivity risk when score high", () => {
    const alerts = detectAlerts({
      ...base,
      workload: [],
      safety: safety(80),
      risk: risk(85),
    });
    expect(alerts.some((a) => a.type === "productivity_risk")).toBe(true);
  });

  it("flags stagnation when learning is old", () => {
    const learning: LearningActivity[] = [
      {
        id: "l1",
        employeeId: "a",
        type: "course",
        title: "x",
        skill: "s",
        level: "beginner",
        hours: 1,
        completedAt: new Date("2024-12-01"),
        createdAt: new Date("2024-11-01"),
      },
    ];
    const alerts = detectAlerts({
      ...base,
      learning,
      workload: [],
      safety: safety(80),
      risk: risk(20),
    });
    expect(alerts.some((a) => a.type === "stagnation" && a.employeeId === "a")).toBe(true);
  });

  it("returns no alerts when everything healthy", () => {
    const recent = new Date("2025-01-15");
    const learning: LearningActivity[] = [
      {
        id: "la",
        employeeId: "a",
        type: "course",
        title: "x",
        skill: "s",
        level: "beginner",
        hours: 1,
        completedAt: recent,
        createdAt: recent,
      },
      {
        id: "lb",
        employeeId: "b",
        type: "course",
        title: "y",
        skill: "s",
        level: "beginner",
        hours: 1,
        completedAt: recent,
        createdAt: recent,
      },
    ];
    const alerts = detectAlerts({
      members: [member("a"), member("b")],
      learning,
      workload: [workload("a", 50), workload("b", 50)],
      safety: safety(85),
      risk: risk(20),
      now: new Date("2025-01-31"),
    });
    expect(alerts.length).toBe(0);
  });
});
