import { z } from "zod";
import { IGoalProgressRepository } from "../../domain/repositories/IGoalProgressRepository";
import { IProjectRepository } from "../../domain/repositories/IProjectRepository";
import { computeGoalProgress } from "../../domain/progress";
import { answerGoalCopilotQuestion } from "@/server/lib/goalInsight";
import { UserFacingError } from "@/server/lib/errors";

export const askCopilotSchema = z.object({
  goalId: z.string().min(1),
  userId: z.string().min(1),
  question: z.string().min(1).max(500),
});

export type AskCopilotInput = z.infer<typeof askCopilotSchema>;

/**
 * AI Copilot use-case. Authorizes the caller, computes the freshest progress
 * report, and asks the copilot layer (Gemini + heuristic fallback) the leader's
 * natural-language question.
 */
export class AskGoalCopilot {
  constructor(
    private readonly goalRepository: IGoalProgressRepository,
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(input: AskCopilotInput) {
    const snapshot = await this.goalRepository.loadSnapshot(input.goalId);
    if (!snapshot) {
      throw new UserFacingError("No encontramos ese objetivo.", 404);
    }
    const isMember = await this.projectRepository.isMember(
      input.userId,
      snapshot.goal.workspaceId
    );
    if (!isMember) {
      throw new UserFacingError("No tienes acceso a este objetivo.", 403);
    }

    const report = computeGoalProgress(snapshot);
    const { answer, usedGemini } = await answerGoalCopilotQuestion(
      input.question,
      report
    );
    return { answer, usedGemini };
  }
}
