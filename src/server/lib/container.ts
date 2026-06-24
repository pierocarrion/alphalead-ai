import { IUserRepository } from "@/features/auth/domain/repositories/IUserRepository";
import { PrismaUserRepository } from "@/features/auth/infrastructure/repositories/PrismaUserRepository";
import { IProjectRepository } from "@/features/projects/domain/repositories/IProjectRepository";
import { PrismaProjectRepository } from "@/features/projects/infrastructure/repositories/PrismaProjectRepository";
import { IGoalProgressRepository } from "@/features/projects/domain/repositories/IGoalProgressRepository";
import { PrismaGoalProgressRepository } from "@/features/projects/infrastructure/repositories/PrismaGoalProgressRepository";
import { ITeamInsightsRepository } from "@/features/insights/domain/repositories/ITeamInsightsRepository";
import { PrismaTeamInsightsRepository } from "@/features/insights/infrastructure/repositories/PrismaTeamInsightsRepository";
import { IKnowledgeRepository } from "@/features/knowledge/domain/repositories/IKnowledgeRepository";
import { PrismaKnowledgeRepository } from "@/features/knowledge/infrastructure/repositories/PrismaKnowledgeRepository";

export interface Container {
  userRepository: IUserRepository;
  projectRepository: IProjectRepository;
  goalProgressRepository: IGoalProgressRepository;
  teamInsightsRepository: ITeamInsightsRepository;
  knowledgeRepository: IKnowledgeRepository;
}

export function createContainer(): Container {
  return {
    userRepository: new PrismaUserRepository(),
    projectRepository: new PrismaProjectRepository(),
    goalProgressRepository: new PrismaGoalProgressRepository(),
    teamInsightsRepository: new PrismaTeamInsightsRepository(),
    knowledgeRepository: new PrismaKnowledgeRepository(),
  };
}

export const container = createContainer();
