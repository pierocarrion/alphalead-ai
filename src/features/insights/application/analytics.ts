import type { ITeamInsightsRepository } from "../domain/repositories/ITeamInsightsRepository";
import type { EmployeeWithMetrics } from "../domain/entities/Employee";
import type { WorkloadBalance } from "../domain/entities/Workload";
import type { PsychologicalSafety } from "../domain/entities/PsychologicalSafety";
import type { ProductivityRisk } from "../domain/entities/ProductivityRisk";
import type {
  LearningProgressKpis,
  LearningEvolutionPoint,
} from "../domain/entities/Learning";
import {
  buildWorkloadBalance,
  buildWorkloadPoint,
  computePsychologicalSafetyScore,
  computeProductivityRiskScore,
  sentimentScoreFromRates,
  defaultCapacityHoursPerWeek,
  round1,
} from "../domain/scoring";
import { isoDate, addDays } from "../domain/scoring/dates";

export interface AssembledCore {
  members: EmployeeWithMetrics[];
  workload: WorkloadBalance;
  safety: PsychologicalSafety;
  risk: ProductivityRisk;
  learningKpis: LearningProgressKpis;
  learningEvolution: LearningEvolutionPoint[];
}

export interface AssembleOptions {
  since: Date;
  until: Date;
  capacityHoursPerWeek?: number;
}

export async function assembleCore(
  repo: ITeamInsightsRepository,
  workspaceId: string,
  memberFilter: Parameters<ITeamInsightsRepository["listMembers"]>[1],
  options: AssembleOptions
): Promise<AssembledCore> {
  const { since, until } = options;
  const capacity = options.capacityHoursPerWeek ?? defaultCapacityHoursPerWeek();
  const weeks = Math.max(1, Math.round((until.getTime() - since.getTime()) / (7 * 86400000)));

  const [members, tasks, feedback, surveys, checkIns, learning] =
    await Promise.all([
      repo.listMembers(workspaceId, memberFilter),
      repo.listTasks(workspaceId, since),
      repo.listFeedback(workspaceId, since),
      repo.listSurveys(workspaceId, since),
      repo.listCheckIns(workspaceId, since),
      repo.listLearning(workspaceId, since),
    ]);

  const headcount = members.length || 1;

  const tasksByEmployee = groupBy(tasks, (t) => t.userId);
  const surveysByEmployee = groupBy(surveys, (s) => s.userId);
  const feedbackByEmployee = groupBy(
    feedback.filter((f) => f.userId),
    (f) => f.userId as string
  );
  const learningByEmployee = groupBy(learning, (l) => l.employeeId);

  const capacityHours = capacity * weeks;

  const workloadPoints = members.map((m) => {
    const memberTasks = tasksByEmployee.get(m.id) ?? [];
    const estimatedMinutes = sum(memberTasks, (t) => t.estimatedMinutes ?? 0);
    const workedMinutes = sum(memberTasks, (t) => t.workedMinutes ?? 0);
    return buildWorkloadPoint(
      {
        employeeId: m.id,
        name: m.name,
        totalTasks: memberTasks.length,
        estimatedMinutes,
        workedMinutes,
      },
      capacityHours
    );
  });
  const workload = buildWorkloadBalance(workloadPoints);

  const memberMetrics = members.map((m) => {
    const memberTasks = tasksByEmployee.get(m.id) ?? [];
    const completedTasks = memberTasks.filter(
      (t) => t.status === "done" || t.status === "completed"
    ).length;
    const activeTasks = memberTasks.filter(
      (t) => t.status !== "done" && t.status !== "completed"
    ).length;
    const estimatedHours =
      sum(memberTasks, (t) => t.estimatedMinutes ?? 0) / 60;
    const workedHours = sum(memberTasks, (t) => t.workedMinutes ?? 0) / 60;

    const memberSurveys = surveysByEmployee.get(m.id) ?? [];
    const memberFeedback = feedbackByEmployee.get(m.id) ?? [];
    const memberLearning = learningByEmployee.get(m.id) ?? [];

    const sentimentScore = employeeSentimentScore(
      memberSurveys,
      memberFeedback
    );

    return {
      ...m,
      employeeId: m.id,
      activeTasks,
      completedTasks,
      workedHours: round1(workedHours),
      estimatedHours: round1(estimatedHours),
      progressPct: completionPct(memberTasks),
      learningProgress: round1(employeeLearningProgress(memberLearning)),
      sentimentScore: round1(sentimentScore),
      sentiment: classifyEmployeeSentiment(sentimentScore),
      sentimentHasData:
        memberSurveys.length > 0 || memberFeedback.length > 0,
    } satisfies EmployeeWithMetrics;
  });

  const safetyHasData = surveys.length > 0 || feedback.length > 0;
  const surveyAvg = surveys.length > 0 ? avg(surveys.map((s) => s.psychologicalSafety)) : 0;
  const feedbackAvg = feedbackAvgScore(feedback);
  const participationRate = participationPct(checkIns, members, since, until);
  const sentimentTeam = teamSentimentScore(surveys);

  const trend = surveyTrend(surveys, since, until);
  const safetyScored = computePsychologicalSafetyScore({
    surveyAvg,
    feedbackAvg,
    participationRate,
    sentimentScore: sentimentTeam,
    trend,
  });
  const safety: PsychologicalSafety = {
    ...safetyScored,
    hasData: safetyHasData,
    trend,
  };

  const overdueTasks = tasks.filter(isOverdue);
  const overdueRatio = tasks.length > 0 ? overdueTasks.length / tasks.length : 0;
  const taskMissRatio =
    tasks.length > 0
      ? tasks.filter((t) => t.status !== "done" && t.status !== "completed").length /
        tasks.length
      : 0;
  const overloadRatio =
    headcount > 0
      ? workloadPoints.filter((w) => w.overload).length / headcount
      : 0;
  const activityDeclinePct = activityDecline(tasks, since, until);
  const absenteeismPct = absenteeism(checkIns, members, since, until);

  const riskScored = computeProductivityRiskScore({
    overloadRatio,
    overdueRatio,
    activityDeclinePct,
    participationRate,
    taskMissRatio,
    absenteeismPct,
  });
  const risk: ProductivityRisk = {
    ...riskScored,
    trend: [],
  };

  const learningKpis: LearningProgressKpis = {
    coursesStarted: learning.length,
    coursesCompleted: learning.filter((l) => l.completedAt).length,
    learningHours: round1(sum(learning, (l) => l.hours)),
    certifications: learning.filter(
      (l) => l.type === "certification" && l.completedAt
    ).length,
  };

  const buckets = weeklyBuckets(since, until);
  const learningEvolution: LearningEvolutionPoint[] = buckets.map((b) => {
    const inBucket = learning.filter(
      (l) => l.createdAt >= b.start && l.createdAt <= b.end
    );
    return {
      date: b.label,
      started: inBucket.length,
      completed: inBucket.filter((l) => l.completedAt).length,
      hours: round1(sum(inBucket, (l) => l.hours)),
      skills: new Set(inBucket.map((l) => l.skill).filter(Boolean)).size,
    };
  });

  return {
    members: memberMetrics,
    workload,
    safety,
    risk,
    learningKpis,
    learningEvolution,
  };
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

function sum<T>(items: T[], value: (t: T) => number): number {
  return items.reduce((a, i) => a + value(i), 0);
}

function avg(items: number[]): number {
  if (items.length === 0) return 0;
  return items.reduce((a, b) => a + b, 0) / items.length;
}

function completionPct(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter(
    (t) => t.status === "done" || t.status === "completed"
  ).length;
  return round1((done / tasks.length) * 100);
}

function employeeSentimentScore(
  surveys: { sentiment: string; psychologicalSafety: number }[],
  feedback: { score: number | null; metricValue: number | null }[]
): number {
  const positive = [
    ...surveys.filter((s) => s.sentiment === "positive"),
    ...feedback.filter((f) => (f.score ?? f.metricValue ?? 0) >= 4),
  ].length;
  const risk = [
    ...surveys.filter((s) => s.sentiment === "risk"),
    ...feedback.filter((f) => (f.score ?? f.metricValue ?? 0) <= 2),
  ].length;
  const total = surveys.length + feedback.length;
  if (total === 0) return 0;
  return sentimentScoreFromRates(positive / total, risk / total);
}

function teamSentimentScore(
  surveys: { sentiment: string }[]
): number {
  if (surveys.length === 0) return 0;
  const positive = surveys.filter((s) => s.sentiment === "positive").length;
  const risk = surveys.filter((s) => s.sentiment === "risk").length;
  return sentimentScoreFromRates(positive / surveys.length, risk / surveys.length);
}

function classifyEmployeeSentiment(
  score: number
): EmployeeWithMetrics["sentiment"] {
  if (score >= 66) return "positive";
  if (score >= 40) return "neutral";
  return "risk";
}

function employeeLearningProgress(
  learning: { completedAt: Date | null }[]
): number {
  if (learning.length === 0) return 0;
  const completed = learning.filter((l) => l.completedAt).length;
  return (completed / learning.length) * 100;
}

function feedbackAvgScore(
  feedback: { score: number | null; metricValue: number | null }[]
): number {
  const values = feedback
    .map((f) => f.score ?? f.metricValue)
    .filter((v): v is number => typeof v === "number");
  if (values.length === 0) return 0;
  const normalized = avg(values.map((v) => (v <= 5 ? (v / 5) * 100 : v)));
  return normalized;
}

function participationPct(
  checkIns: { userId: string; date: Date }[],
  members: { id: string }[],
  since: Date,
  until: Date
): number {
  if (members.length === 0) return 0;
  const days = Math.max(1, Math.round((until.getTime() - since.getTime()) / 86400000));
  const expected = members.length * days;
  if (expected === 0) return 0;
  const distinct = new Set(checkIns.map((c) => `${c.userId}:${isoDate(c.date)}`))
    .size;
  return round1((distinct / expected) * 100);
}

function absenteeism(
  checkIns: { userId: string; date: Date }[],
  members: { id: string }[],
  since: Date,
  until: Date
): number {
  if (members.length === 0) return 0;
  const days = Math.max(1, Math.round((until.getTime() - since.getTime()) / 86400000));
  const expected = members.length * days;
  if (expected === 0) return 0;
  const distinct = new Set(checkIns.map((c) => `${c.userId}:${isoDate(c.date)}`))
    .size;
  return round1(Math.max(0, (1 - distinct / expected) * 100));
}

function isOverdue(task: {
  deadline: Date | null;
  status: string;
}): boolean {
  if (!task.deadline) return false;
  if (task.status === "done" || task.status === "completed") return false;
  return task.deadline.getTime() < Date.now();
}

function activityDecline(
  tasks: { createdAt: Date; completedAt: Date | null }[],
  since: Date,
  until: Date
): number {
  const mid = new Date((since.getTime() + until.getTime()) / 2);
  const firstHalf = tasks.filter((t) => t.createdAt < mid);
  const secondHalf = tasks.filter((t) => t.createdAt >= mid);
  const first = firstHalf.length;
  const second = secondHalf.length;
  if (first === 0) return second === 0 ? 0 : 0;
  const change = (second - first) / first;
  return round1(Math.max(0, -change * 100));
}

function weeklyBuckets(since: Date, until: Date) {
  const buckets: { label: string; start: Date; end: Date }[] = [];
  let cursor = new Date(since);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(until);
  end.setHours(23, 59, 59, 999);
  while (cursor <= end) {
    const next = addDays(cursor, 7);
    const sliceEnd = next > end ? end : new Date(next.getTime() - 1);
    buckets.push({ label: isoDate(cursor), start: cursor, end: sliceEnd });
    cursor = next;
  }
  return buckets;
}

function surveyTrend(
  surveys: { psychologicalSafety: number; createdAt: Date }[],
  since: Date,
  until: Date
): { date: string; score: number }[] {
  return weeklyBuckets(since, until).map((b) => {
    const inBucket = surveys.filter(
      (s) => s.createdAt >= b.start && s.createdAt <= b.end
    );
    return {
      date: b.label,
      score: round1(
        inBucket.length > 0
          ? avg(inBucket.map((s) => s.psychologicalSafety))
          : 0
      ),
    };
  });
}
