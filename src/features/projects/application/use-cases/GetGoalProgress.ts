import { z } from "zod";
import { IGoalProgressRepository } from "../../domain/repositories/IGoalProgressRepository";
import { IProjectRepository } from "../../domain/repositories/IProjectRepository";
import { computeGoalProgress } from "../../domain/progress";
import type { GoalProgressReport } from "../../domain/entities/SmartGoal";
import { UserFacingError } from "@/server/lib/errors";

/**
 * Loads a goal snapshot, authorizes the caller against the goal's workspace,
 * and runs the full AI Progress Engine to produce a composite report.
 */
export class GetGoalProgress {
  constructor(
    private readonly goalRepository: IGoalProgressRepository,
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(goalId: string, userId: string): Promise<GoalProgressReport> {
    const snapshot = await this.goalRepository.loadSnapshot(goalId);
    if (!snapshot) {
      throw new UserFacingError("No encontramos ese objetivo.", 404);
    }

    const isMember = await this.projectRepository.isMember(
      userId,
      snapshot.goal.workspaceId
    );
    if (!isMember) {
      throw new UserFacingError("No tienes acceso a este objetivo.", 403);
    }

    return computeGoalProgress(snapshot);
  }
}

export const goalIdSchema = z.object({
  goalId: z.string().min(1),
  userId: z.string().min(1),
});
