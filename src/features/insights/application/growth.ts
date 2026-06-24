import type { ITeamInsightsRepository } from "../domain/repositories/ITeamInsightsRepository";
import type { TeamGrowth, GrowthGranularity } from "../domain/entities/TeamGrowth";
import { computeGrowthIndex, round1, clampPct } from "../domain/scoring";
import { bucketsFor, defaultWindow, isoDate } from "../domain/scoring/dates";

export async function computeGrowth(
  repo: ITeamInsightsRepository,
  workspaceId: string,
  granularity: GrowthGranularity,
  sinceInput: Date,
  untilInput: Date
): Promise<TeamGrowth> {
  const { since, until } =
    granularity && sinceInput && untilInput
      ? { since: sinceInput, until: untilInput }
      : defaultWindow(granularity);

  const [learning, skills, checkIns, tasks] = await Promise.all([
    repo.listLearning(workspaceId, since),
    repo.listSkills(workspaceId),
    repo.listCheckIns(workspaceId, since),
    repo.listTasks(workspaceId, since),
  ]);

  const buckets = bucketsFor(granularity, since, until);

  const points = buckets.map((bucket) => {
    const inBucket = learning.filter(
      (l) => l.createdAt >= bucket.start && l.createdAt <= bucket.end
    );
    const completed = inBucket.filter((l) => l.completedAt).length;
    const certifications = inBucket.filter(
      (l) => l.type === "certification" && l.completedAt
    ).length;
    const newSkills = new Set(
      inBucket.map((l) => l.skill).filter((s): s is string => Boolean(s))
    ).size;

    const bucketTasks = tasks.filter(
      (t) => t.createdAt >= bucket.start && t.createdAt <= bucket.end
    );
    const sustainableProductivity = clampPct(
      bucketTasks.length === 0
        ? 50
        : Math.min(100, (bucketTasks.filter((t) => t.completedAt).length / Math.max(1, bucketTasks.length)) * 100)
    );

    const bucketCheckIns = checkIns.filter(
      (c) => c.date >= bucket.start && c.date <= bucket.end
    );
    const expectedCheckIns = Math.max(1, bucketCheckIns.length);
    const participation = clampPct(
      bucketCheckIns.length === 0
        ? 0
        : Math.min(100, (bucketCheckIns.length / expectedCheckIns) * 100)
    );

    const headcount = Math.max(1, uniqueEmployeeCount(learning, skills, checkIns, tasks, bucket));

    const growthIndex = computeGrowthIndex({
      coursesCompletedPct: clampPct((completed / headcount) * 50),
      newSkillsPct: clampPct((newSkills / headcount) * 50),
      certificationsPct: clampPct((certifications / headcount) * 80),
      sustainableProductivity,
      participation,
    });

    return {
      date: bucket.label,
      growthIndex: round1(growthIndex),
      coursesCompleted: completed,
      newSkills,
      certifications,
      sustainableProductivity: round1(sustainableProductivity),
      participation: round1(participation),
    };
  });

  const current = points[points.length - 1]?.growthIndex ?? 0;
  const previous = points[points.length - 2]?.growthIndex ?? current;
  const deltaPct =
    previous === 0
      ? current > 0
        ? 100
        : 0
      : round1(((current - previous) / previous) * 100);

  return {
    granularity,
    points,
    current: round1(current),
    previous: round1(previous),
    deltaPct,
  };
}

function uniqueEmployeeCount(
  learning: { employeeId: string; createdAt: Date }[],
  skills: { employeeId: string }[],
  checkIns: { userId: string; date: Date }[],
  tasks: { userId: string; createdAt: Date }[],
  bucket: { start: Date; end: Date }
): number {
  const ids = new Set<string>();
  for (const l of learning) if (l.createdAt >= bucket.start && l.createdAt <= bucket.end) ids.add(l.employeeId);
  for (const s of skills) ids.add(s.employeeId);
  for (const c of checkIns) if (c.date >= bucket.start && c.date <= bucket.end) ids.add(c.userId);
  for (const t of tasks) if (t.createdAt >= bucket.start && t.createdAt <= bucket.end) ids.add(t.userId);
  return Math.max(1, ids.size);
}

export { isoDate };
