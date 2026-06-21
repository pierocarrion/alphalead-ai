import { IUserRepository } from "@/features/auth/domain/repositories/IUserRepository";
import { PrismaUserRepository } from "@/features/auth/infrastructure/repositories/PrismaUserRepository";

export interface Container {
  userRepository: IUserRepository;
}

export function createContainer(): Container {
  return {
    userRepository: new PrismaUserRepository(),
  };
}

export const container = createContainer();
