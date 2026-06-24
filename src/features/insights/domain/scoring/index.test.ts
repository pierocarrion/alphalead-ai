import { describe, it, expect } from "vitest";
import {
  computeOccupationPct,
  computePsychologicalSafetyScore,
  computeProductivityRiskScore,
  computeGrowthIndex,
  sentimentScoreFromRates,
  classifySentiment,
  round1,
  clampPct,
} from "./index";
import { classifyLoadStatus, classifyRiskLevel } from "../entities/Alert";

describe("scoring: workload", () => {
  it("computes occupation from worked hours first", () => {
    expect(
      computeOccupationPct(20, 30, 40)
    ).toBe(50);
  });

  it("falls back to estimated hours when worked is 0", () => {
    expect(computeOccupationPct(0, 30, 40)).toBe(75);
  });

  it("classifies load status thresholds", () => {
    expect(classifyLoadStatus(60)).toBe("balanced");
    expect(classifyLoadStatus(90)).toBe("moderate");
    expect(classifyLoadStatus(130)).toBe("overload");
  });
});

describe("scoring: psychological safety", () => {
  it("weights survey at 50%", () => {
    const r = computePsychologicalSafetyScore({
      surveyAvg: 80,
      feedbackAvg: 80,
      participationRate: 80,
      sentimentScore: 80,
      trend: [],
    });
    expect(r.score).toBe(80);
    expect(r.status).toBe("healthy");
  });

  it("flags critical below 40", () => {
    const r = computePsychologicalSafetyScore({
      surveyAvg: 20,
      feedbackAvg: 20,
      participationRate: 20,
      sentimentScore: 20,
      trend: [],
    });
    expect(r.status).toBe("critical");
  });
});

describe("scoring: productivity risk", () => {
  it("returns high risk when all factors maxed", () => {
    const r = computeProductivityRiskScore({
      overloadRatio: 1,
      overdueRatio: 1,
      activityDeclinePct: 100,
      participationRate: 0,
      taskMissRatio: 1,
      absenteeismPct: 100,
    });
    expect(r.score).toBe(100);
    expect(r.level).toBe("high");
  });

  it("returns low risk when everything healthy", () => {
    const r = computeProductivityRiskScore({
      overloadRatio: 0,
      overdueRatio: 0,
      activityDeclinePct: 0,
      participationRate: 100,
      taskMissRatio: 0,
      absenteeismPct: 0,
    });
    expect(classifyRiskLevel(r.score)).toBe("low");
  });
});

describe("scoring: growth index", () => {
  it("averages the five components", () => {
    expect(
      computeGrowthIndex({
        coursesCompletedPct: 100,
        newSkillsPct: 100,
        certificationsPct: 100,
        sustainableProductivity: 100,
        participation: 100,
      })
    ).toBe(100);
  });
});

describe("scoring: sentiment", () => {
  it("maps net sentiment to 0-100", () => {
    expect(sentimentScoreFromRates(1, 0)).toBe(100);
    expect(sentimentScoreFromRates(0, 1)).toBe(0);
    expect(sentimentScoreFromRates(0.5, 0.5)).toBe(50);
  });

  it("classifies sentiment into states", () => {
    expect(classifySentiment(70)).toBe("positive");
    expect(classifySentiment(50)).toBe("neutral");
    expect(classifySentiment(30)).toBe("risk");
  });
});

describe("scoring: helpers", () => {
  it("clamps to range", () => {
    expect(clampPct(150)).toBe(100);
    expect(clampPct(-10)).toBe(0);
  });
  it("rounds to 1 decimal", () => {
    expect(round1(3.456)).toBe(3.5);
  });
});
