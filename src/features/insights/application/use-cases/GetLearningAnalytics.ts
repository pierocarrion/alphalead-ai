import { z } from "zod";
import type { ITeamInsightsRepository } from "../../domain/repositories/ITeamInsightsRepository";
import type {
  SkillCell,
  SkillGap,
  LearningProgressKpis,
  LearningEvolutionPoint,
} from "../../domain/entities/Learning";
import { buildSkillGaps } from "../../domain/scoring/skills";
import { round1 } from "../../domain/scoring";
import { bucketsFor } from "../../domain/scoring/dates";

export const getLearningAnalyticsSchema = z.object({
  workspaceId: z.string().min(1),
  days: z.number().int().min(7).max(365).optional().default(90),
});

export type GetLearningAnalyticsInput = z.infer<
  typeof getLearningAnalyticsSchema
>;

export interface LearningAnalyticsResult {
  skillsMatrix: SkillCell[];
  skillGaps: SkillGap[];
  kpis: LearningProgressKpis;
  evolution: LearningEvolutionPoint[];
}

export class GetLearningAnalytics {
  constructor(private readonly repo: ITeamInsightsRepository) {}

  async execute(input: GetLearningAnalyticsInput): Promise<LearningAnalyticsResult> {
    const until = new Date();
    const since = new Date(until.getTime() - input.days * 86400000);

    const [skills, learning, members] = await Promise.all([
      this.repo.listSkills(input.workspaceId),
      this.repo.listLearning(input.workspaceId, since),
      this.repo.listMembers(input.workspaceId),
    ]);

    const skillGaps = buildSkillGaps(skills, members.length);

    const kpis: LearningProgressKpis = {
      coursesStarted: learning.length,
      coursesCompleted: learning.filter((l) => l.completedAt).length,
      learningHours: round1(learning.reduce((a, l) => a + l.hours, 0)),
      certifications: learning.filter(
        (l) => l.type === "certification" && l.completedAt
      ).length,
    };

    const buckets = bucketsFor("week", since, until);
    const evolution: LearningEvolutionPoint[] = buckets.map((b) => {
      const inBucket = learning.filter(
        (l) => l.createdAt >= b.start && l.createdAt <= b.end
      );
      return {
        date: b.label,
        started: inBucket.length,
        completed: inBucket.filter((l) => l.completedAt).length,
        hours: round1(inBucket.reduce((a, l) => a + l.hours, 0)),
        skills: new Set(inBucket.map((l) => l.skill).filter(Boolean)).size,
      };
    });

    return { skillsMatrix: skills, skillGaps, kpis, evolution };
  }
}
