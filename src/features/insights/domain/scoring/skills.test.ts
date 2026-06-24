import { describe, it, expect } from "vitest";
import { buildSkillGaps, uniqueSkills } from "./skills";
import type { SkillCell } from "../entities/Learning";

function cell(
  employeeId: string,
  employeeName: string,
  skill: string,
  level: SkillCell["level"]
): SkillCell {
  return { employeeId, employeeName, skill, level };
}

describe("skills", () => {
  it("lists unique skills sorted", () => {
    const cells = [
      cell("1", "A", "React", "advanced"),
      cell("2", "B", "Kubernetes", "beginner"),
      cell("3", "C", "React", "expert"),
    ];
    expect(uniqueSkills(cells)).toEqual(["Kubernetes", "React"]);
  });

  it("flags high risk when only one holder", () => {
    const gaps = buildSkillGaps(
      [cell("1", "A", "Kubernetes", "advanced")],
      5
    );
    const k8s = gaps.find((g) => g.skill === "Kubernetes");
    expect(k8s?.riskLevel).toBe("high");
    expect(k8s?.holders).toBe(1);
    expect(k8s?.recommendation).toContain("Dependencia crítica");
  });

  it("flags high risk when no experts", () => {
    const gaps = buildSkillGaps(
      [
        cell("1", "A", "Go", "beginner"),
        cell("2", "B", "Go", "intermediate"),
      ],
      4
    );
    const go = gaps.find((g) => g.skill === "Go");
    expect(go?.riskLevel).toBe("high");
    expect(go?.experts).toBe(0);
  });

  it("low risk when widely covered", () => {
    const gaps = buildSkillGaps(
      [
        cell("1", "A", "JS", "expert"),
        cell("2", "B", "JS", "advanced"),
        cell("3", "C", "JS", "intermediate"),
        cell("4", "D", "JS", "beginner"),
      ],
      4
    );
    const js = gaps.find((g) => g.skill === "JS");
    expect(js?.riskLevel).toBe("low");
    expect(js?.holders).toBe(4);
  });
});
