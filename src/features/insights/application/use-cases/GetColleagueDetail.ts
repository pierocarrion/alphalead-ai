import { z } from "zod";
import type { ITeamInsightsRepository } from "../../domain/repositories/ITeamInsightsRepository";
import type { ColleagueDetail } from "../../domain/entities/TeamOverview";
import { round1 } from "../../domain/scoring";
import { bucketsFor, isoDate } from "../../domain/scoring/dates";

export const getColleagueDetailSchema = z.object({
  workspaceId: z.string().min(1),
  employeeId: z.string().min(1),
  days: z.number().int().min(7).max(365).optional().default(90),
});

export type GetColleagueDetailInput = z.infer<typeof getColleagueDetailSchema>;

export class GetColleagueDetail {
  constructor(private readonly repo: ITeamInsightsRepository) {}

  async execute(input: GetColleagueDetailInput): Promise<ColleagueDetail> {
    const until = new Date();
    const since = new Date(until.getTime() - input.days * 86400000);

    const [members, activity, learning, surveys, feedback, tasks, checkIns] =
      await Promise.all([
        this.repo.listMembers(input.workspaceId),
        this.repo.listEmployeeActivity(
          input.workspaceId,
          input.employeeId,
          30
        ),
        this.repo.listLearning(input.workspaceId, since),
        this.repo.listSurveys(input.workspaceId, since),
        this.repo.listFeedback(input.workspaceId, since),
        this.repo.listTasks(input.workspaceId, since),
        this.repo.listCheckIns(input.workspaceId, since),
      ]);

    const employee = members.find((m) => m.id === input.employeeId);
    if (!employee) {
      throw new Error("Colaborador no encontrado");
    }

    const recentActivity = activity
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, 20)
      .map((a) => ({
        date: isoDate(a.occurredAt),
        kind: a.type,
        title: a.title,
        detail: a.detail ?? undefined,
      }));

    const employeeLearning = learning.filter(
      (l) => l.employeeId === input.employeeId
    );
    const buckets = bucketsFor("week", since, until);
    const learningEvolution = buckets.map((b) => {
      const inBucket = employeeLearning.filter(
        (l) => l.createdAt >= b.start && l.createdAt <= b.end
      );
      return {
        date: b.label,
        started: inBucket.length,
        completed: inBucket.filter((l) => l.completedAt).length,
        hours: round1(inBucket.reduce((a, l) => a + l.hours, 0)),
        skills: new Set(
          inBucket.map((l) => l.skill).filter((s): s is string => Boolean(s))
        ).size,
      };
    });

    const employeeTasks = tasks.filter((t) => t.userId === input.employeeId);
    const productivityEvolution = buildProductivityEvolution(
      employeeTasks,
      buckets
    );

    const employeeSurveys = surveys.filter(
      (s) => s.userId === input.employeeId
    );
    const employeeCheckIns = checkIns.filter(
      (c) => c.userId === input.employeeId
    );
    const employeeFeedback = feedback.filter((f) => f.userId === input.employeeId);
    const wellbeingHistory = buildWellbeingHistory(
      employeeSurveys,
      employeeCheckIns,
      employeeFeedback,
      buckets
    );

    return {
      employee: { ...employee, employeeId: employee.id },
      recentActivity,
      learningEvolution,
      productivityEvolution,
      wellbeingHistory,
    };
  }
}

function buildProductivityEvolution(
  tasks: {
    id: string;
    createdAt: Date;
    completedAt: Date | null;
    deadline: Date | null;
  }[],
  buckets: { label: string; start: Date; end: Date }[]
) {
  return buckets.map((b) => {
    const inBucket = tasks.filter(
      (t) => t.createdAt >= b.start && t.createdAt <= b.end
    );
    const completed = inBucket.filter((t) => t.completedAt);
    const leadTimes = completed
      .filter((t) => t.deadline && t.completedAt)
      .map((t) =>
        Math.max(
          0,
          (t.completedAt!.getTime() - t.createdAt.getTime()) / 86400000
        )
      );
    const cycleTimes = completed
      .filter((t) => t.completedAt)
      .map((t) =>
        Math.max(
          0,
          (t.completedAt!.getTime() - t.createdAt.getTime()) / 86400000
        )
      );
    const deliveryTimes = completed
      .filter((t) => t.deadline && t.completedAt)
      .map((t) =>
        Math.max(
          0,
          (t.completedAt!.getTime() - t.deadline!.getTime()) / 86400000
        )
      );
    const avgArr = (arr: number[]) =>
      arr.length === 0 ? 0 : round1(arr.reduce((a, b) => a + b, 0) / arr.length);
    return {
      week: b.label,
      completed: completed.length,
      leadTimeDays: avgArr(leadTimes),
      cycleTimeDays: avgArr(cycleTimes),
      avgDeliveryDays: avgArr(deliveryTimes),
    };
  });
}

function buildWellbeingHistory(
  surveys: { psychologicalSafety: number; sentiment: string; createdAt: Date }[],
  checkIns: { mood: string | null; energy: number | null; date: Date }[],
  feedback: { score: number | null; metricValue: number | null; createdAt: Date }[],
  buckets: { label: string; start: Date; end: Date }[]
) {
  return buckets.map((b) => {
    const bucketSurveys = surveys.filter(
      (s) => s.createdAt >= b.start && s.createdAt <= b.end
    );
    const bucketCheckIns = checkIns.filter(
      (c) => c.date >= b.start && c.date <= b.end
    );
    const bucketFeedback = feedback.filter(
      (f) => f.createdAt >= b.start && f.createdAt <= b.end
    );
    const feedbackScores = bucketFeedback
      .map((f) => f.score ?? f.metricValue)
      .filter((v): v is number => typeof v === "number");
    const feedbackSatisfaction =
      feedbackScores.length > 0
        ? round1(
            (feedbackScores.reduce((a, v) => a + (v <= 5 ? (v / 5) * 100 : v), 0) /
              feedbackScores.length)
          )
        : 0;
    const surveySatisfaction =
      bucketSurveys.length > 0
        ? round1(
            bucketSurveys.reduce((a, s) => a + s.psychologicalSafety, 0) /
              bucketSurveys.length
          )
        : null;
    const hasFeedback = feedbackSatisfaction > 0;
    const hasSurvey = surveySatisfaction !== null;
    const satisfaction = !hasSurvey && !hasFeedback
      ? 0
      : round1(
          (hasSurvey ? surveySatisfaction * 0.6 : 0) +
            (hasFeedback ? feedbackSatisfaction * 0.4 : 0) +
            (hasSurvey && !hasFeedback ? surveySatisfaction * 0.4 : 0) +
            (hasFeedback && !hasSurvey ? feedbackSatisfaction * 0.6 : 0)
        );
    const participation = Math.min(100, bucketCheckIns.length * 20);
    const dominantSentiment = dominant(
      bucketSurveys.map((s) => s.sentiment).concat(
        bucketCheckIns.map((c) => c.mood ?? "neutral")
      )
    );
    return {
      date: b.label,
      sentiment: dominantSentiment,
      satisfaction,
      participation: round1(participation),
    };
  });
}

function dominant(values: string[]): string {
  if (values.length === 0) return "neutral";
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
