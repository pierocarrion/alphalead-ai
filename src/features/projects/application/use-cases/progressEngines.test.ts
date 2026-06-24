import { describe, expect, it } from "vitest";
import { computeGoalProgress } from "../../domain/progress";
import { computeProgress } from "../../domain/progress/progressEngine";
import { computeContributions } from "../../domain/progress/contributionEngine";
import { detectRisks, highestRiskLevel } from "../../domain/progress/riskEngine";
import { predictCompletion } from "../../domain/progress/predictionEngine";
import { computeHealth } from "../../domain/progress/healthEngine";
import { validateSmartGoal } from "../../domain/progress/smartValidator";
import type { SmartGoalSnapshot } from "../../domain/entities/SmartGoal";

const NOW = new Date("2026-10-15T12:00:00Z");
const CREATED = new Date("2026-09-15T12:00:00Z"); // 30 days elapsed
const DEADLINE = new Date("2026-10-30T12:00:00Z"); // 15 days left

function baseSnapshot(overrides: Partial<SmartGoalSnapshot> = {}): SmartGoalSnapshot {
  return {
    goal: {
      id: "g1",
      workspaceId: "w1",
      ownerId: "u1",
      title: "Completar lanzamiento Fase 1 antes del Q4",
      specific: "Funcionalidades principales en producción",
      measurable: "5 funcionalidades core desplegadas",
      achievable: "Con el equipo actual de 4 personas",
      relevant: "Habilita el ingreso de clientes pagos",
      deadline: DEADLINE,
      status: "active",
      createdAt: CREATED,
    },
    milestones: [
      { id: "m1", title: "Alpha", status: "completed", dueDate: CREATED, createdAt: CREATED },
      { id: "m2", title: "Beta", status: "pending", dueDate: DEADLINE, createdAt: CREATED },
    ],
    tasks: [
      { id: "t1", title: "Auth", status: "done", userId: "u1", load: "Heavy", estimatedMinutes: 120, priority: 3, createdAt: CREATED, completedAt: CREATED },
      { id: "t2", title: "Dashboard", status: "done", userId: "u2", load: "Medium", estimatedMinutes: 90, priority: 2, createdAt: CREATED, completedAt: CREATED },
      { id: "t3", title: "API", status: "open", userId: "u1", load: "Heavy", estimatedMinutes: 240, priority: 5, createdAt: CREATED, completedAt: null },
      { id: "t4", title: "Docs", status: "open", userId: "u3", load: "Light", estimatedMinutes: 30, priority: 1, createdAt: CREATED, completedAt: null },
    ],
    members: [
      { userId: "u1", name: "Sara" },
      { userId: "u2", name: "Mark" },
      { userId: "u3", name: "Amber" },
    ],
    ...overrides,
  };
}

describe("smartValidator", () => {
  it("scores a fully SMART goal >= 80", () => {
    const v = validateSmartGoal(baseSnapshot().goal);
    expect(v.isSmart).toBe(true);
    expect(v.score).toBeGreaterThanOrEqual(80);
    expect(v.checks).toHaveLength(5);
  });

  it("fails SMART when fields are empty", () => {
    const v = validateSmartGoal({
      ...baseSnapshot().goal,
      title: "Lanzamiento",
      specific: "Sin detalle",
      measurable: null,
      deadline: null,
    });
    expect(v.isSmart).toBe(false);
    expect(v.checks.find((c) => c.key === "time-bound")?.passed).toBe(false);
  });
});

describe("progressEngine", () => {
  it("computes progress from tasks (60%) and milestones (40%)", () => {
    const snapshot = baseSnapshot();
    const p = computeProgress(snapshot, NOW);
    // 1 of 2 milestones = 50%; done weight = 3+2=5 of total 3+2+3+1=9 => 55.5%
    // 0.4*50 + 0.6*55.5 = 53.3 => 53
    expect(p.goalProgress).toBe(53);
    expect(p.pending).toBe(47);
    expect(p.status).toBe("Behind Schedule");
    expect(p.velocity).toBeGreaterThan(0);
  });

  it("returns 100 / Completed for a completed goal", () => {
    const snapshot = baseSnapshot({
      goal: { ...baseSnapshot().goal, status: "completed" },
    });
    const p = computeProgress(snapshot, NOW);
    expect(p.goalProgress).toBe(100);
    expect(p.status).toBe("Completed");
  });

  it("handles a goal with no work as Not Started", () => {
    const snapshot = baseSnapshot({ milestones: [], tasks: [] });
    const p = computeProgress(snapshot, NOW);
    expect(p.goalProgress).toBe(0);
    expect(p.status).toBe("Not Started");
  });
});

describe("contributionEngine", () => {
  it("attributes shares proportionally to weighted completions", () => {
    // No completed milestones here so attribution is purely task-weight based:
    // done weight u1=3 (Heavy), u2=2 (Medium) => 60% / 40%.
    const snapshot = baseSnapshot({
      milestones: [
        { id: "m1", title: "Alpha", status: "pending", dueDate: DEADLINE, createdAt: CREATED },
      ],
    });
    const c = computeContributions(snapshot, NOW);
    const sara = c.members.find((m) => m.userId === "u1");
    const mark = c.members.find((m) => m.userId === "u2");
    expect(sara?.share).toBe(60);
    expect(mark?.share).toBe(40);
    expect(c.members[0].share).toBeGreaterThanOrEqual(c.members[1].share);
  });

  it("produces all five scores in 0..100", () => {
    const c = computeContributions(baseSnapshot(), NOW);
    for (const m of c.members) {
      for (const score of [
        m.contributionScore,
        m.deliveryScore,
        m.qualityScore,
        m.collaborationScore,
        m.reliabilityScore,
      ]) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("riskEngine", () => {
  it("flags behind-schedule when expected >> actual", () => {
    const signals = detectRisks(baseSnapshot(), NOW);
    const behind = signals.find((s) => s.type === "behind_schedule");
    expect(behind).toBeTruthy();
    expect(highestRiskLevel(signals)).not.toBeNull();
  });

  it("flags no_milestones when there is no work", () => {
    const signals = detectRisks(baseSnapshot({ milestones: [], tasks: [] }), NOW);
    expect(signals[0].type).toBe("no_milestones");
  });
});

describe("predictionEngine", () => {
  it("predicts a probability between 0 and 100 and a date", () => {
    const p = predictCompletion(baseSnapshot(), NOW);
    expect(p.completionProbability).toBeGreaterThanOrEqual(0);
    expect(p.completionProbability).toBeLessThanOrEqual(100);
    expect(p.estimatedFinishDate).not.toBeNull();
    expect(["low", "medium", "high", "critical"]).toContain(p.riskLevel);
  });

  it("returns 100% for a completed goal", () => {
    const snapshot = baseSnapshot({
      goal: { ...baseSnapshot().goal, status: "completed" },
    });
    const p = predictCompletion(snapshot, NOW);
    expect(p.completionProbability).toBe(100);
  });
});

describe("healthEngine", () => {
  it("returns a health score blended from sub-metrics", () => {
    const h = computeHealth(baseSnapshot(), NOW);
    expect(h.healthScore).toBeGreaterThanOrEqual(0);
    expect(h.healthScore).toBeLessThanOrEqual(100);
    expect(h.goalAlignment).toBeGreaterThanOrEqual(80);
    expect(h.burnRate).toBeGreaterThan(0);
  });
});

describe("computeGoalProgress (orchestrator)", () => {
  it("returns the full composite report with stable shape", () => {
    const report = computeGoalProgress(baseSnapshot(), NOW);
    expect(report.goalId).toBe("g1");
    expect(report.progress.goalProgress).toBe(53);
    expect(report.contributions.members.length).toBeGreaterThan(0);
    expect(report.risks.length).toBeGreaterThan(0);
    expect(report.timeline.length).toBeGreaterThan(0);
    expect(report.insights.length).toBeGreaterThan(0);
    expect(report.usedGemini).toBe(false);
    expect(report.prediction.completionProbability).toBeGreaterThanOrEqual(0);
    expect(report.health.healthScore).toBeGreaterThanOrEqual(0);
  });

  it("timeline is sorted newest first", () => {
    const report = computeGoalProgress(baseSnapshot(), NOW);
    const timestamps = report.timeline.map((e) => new Date(e.date).getTime());
    const sorted = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sorted);
  });
});
