import { z } from "zod";
import { IGoalProgressRepository } from "../../domain/repositories/IGoalProgressRepository";
import { IProjectRepository } from "../../domain/repositories/IProjectRepository";
import { validateSmartGoal } from "../../domain/progress";
import type { SmartValidation } from "../../domain/entities/SmartGoal";
import { UserFacingError } from "@/server/lib/errors";

export const createSmartGoalSchema = z.object({
  userId: z.string().min(1),
  workspaceId: z.string().min(1),
  title: z.string().min(2).max(120),
  specific: z.string().max(500).optional(),
  measurable: z.string().max(500).optional(),
  achievable: z.string().max(500).optional(),
  relevant: z.string().max(500).optional(),
  deadline: z.coerce.date().optional(),
});

export type CreateSmartGoalInput = z.infer<typeof createSmartGoalSchema>;

export class CreateSmartGoal {
  constructor(
    private readonly goalRepository: IGoalProgressRepository,
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(input: CreateSmartGoalInput) {
    const isMember = await this.projectRepository.isMember(
      input.userId,
      input.workspaceId
    );
    if (!isMember) {
      throw new UserFacingError("No tienes acceso a este proyecto.", 403);
    }
    return this.goalRepository.create({
      workspaceId: input.workspaceId,
      ownerId: input.userId,
      title: input.title.trim(),
      specific: input.specific?.trim() || null,
      measurable: input.measurable?.trim() || null,
      achievable: input.achievable?.trim() || null,
      relevant: input.relevant?.trim() || null,
      deadline: input.deadline ?? null,
    });
  }
}

export const updateSmartGoalSchema = z.object({
  goalId: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(2).max(120).optional(),
  specific: z.string().max(500).nullable().optional(),
  measurable: z.string().max(500).nullable().optional(),
  achievable: z.string().max(500).nullable().optional(),
  relevant: z.string().max(500).nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  status: z.enum(["active", "completed", "archived"]).optional(),
});

export type UpdateSmartGoalInput = z.infer<typeof updateSmartGoalSchema>;

export class UpdateSmartGoal {
  constructor(
    private readonly goalRepository: IGoalProgressRepository,
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(input: UpdateSmartGoalInput) {
    const { goalId, userId, ...patch } = input;
    const snapshot = await this.goalRepository.loadSnapshot(goalId);
    if (!snapshot) {
      throw new UserFacingError("No encontramos ese objetivo.", 404);
    }
    const isLeader = await this.projectRepository.isLeader(
      userId,
      snapshot.goal.workspaceId
    );
    if (!isLeader) {
      throw new UserFacingError(
        "Solo el líder puede editar el objetivo.",
        403
      );
    }
    return this.goalRepository.update(goalId, patch);
  }
}

/**
 * Validates a goal's SMART criteria and returns the structured report.
 */
export class ValidateSmartGoal {
  constructor(
    private readonly goalRepository: IGoalProgressRepository,
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(goalId: string, userId: string): Promise<SmartValidation> {
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
    return validateSmartGoal(snapshot.goal);
  }
}
