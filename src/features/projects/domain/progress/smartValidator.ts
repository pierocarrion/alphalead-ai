import type { SmartGoalRecord, SmartValidation } from "../entities/SmartGoal";

/**
 * Validates whether a goal satisfies SMART criteria.
 * Deterministic heuristic — the foundation the AI layer can build on / override.
 */
export function validateSmartGoal(goal: SmartGoalRecord): SmartValidation {
  const checks: SmartValidation["checks"] = [
    {
      key: "specific",
      label: "Specific",
      passed: nonEmpty(goal.specific) || wordsAtLeast(goal.title, 3),
      hint: "Describe concretamente qué se logrará (qué, quién, dónde).",
    },
    {
      key: "measurable",
      label: "Measurable",
      passed: nonEmpty(goal.measurable) || hasMetricOrCount(goal),
      hint: "Agrega una métrica de éxito cuantificable.",
    },
    {
      key: "achievable",
      label: "Achievable",
      passed: nonEmpty(goal.achievable),
      hint: "Indica por qué la meta es realista con los recursos actuales.",
    },
    {
      key: "relevant",
      label: "Relevant",
      passed: nonEmpty(goal.relevant),
      hint: "Conecta el objetivo con el propósito del proyecto.",
    },
    {
      key: "time-bound",
      label: "Time-bound",
      passed: !!goal.deadline,
      hint: "Asigna una fecha límite clara.",
    },
  ];
  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  return { isSmart: score >= 80, score, checks };
}

function nonEmpty(value: string | null | undefined): boolean {
  return !!value && value.trim().length >= 3;
}

function wordsAtLeast(text: string, n: number): boolean {
  return text.trim().split(/\s+/).filter(Boolean).length >= n;
}

function hasMetricOrCount(goal: SmartGoalRecord): boolean {
  const text = `${goal.title} ${goal.specific ?? ""}`;
  return /\b\d+(\s*%|\s*(de|of))?\b/i.test(text);
}
