import { prisma } from "@/server/lib/prisma";
import {
  CreateUserInput,
  IUserRepository,
  UpdateProfileInput,
} from "../../domain/repositories/IUserRepository";
import { User, UserProfile } from "../../domain/entities/User";

export class PrismaUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    if (!row) return null;
    return this.toUser(row);
  }

  async findById(
    id: string
  ): Promise<(User & { profile: UserProfile | null }) | null> {
    const row = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!row) return null;
    return {
      ...this.toUser(row),
      profile: row.profile ? this.toProfile(row.profile) : null,
    };
  }

  async create(input: CreateUserInput): Promise<User> {
    const row = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: input.passwordHash,
        profile: { create: {} },
      },
    });
    return this.toUser(row);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<UserProfile> {
    const row = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        role: input.role ?? null,
        hardMoment: input.hardMoment ?? null,
        profileId: input.profileId ?? null,
        onboarded: input.onboarded ?? false,
        tone: input.tone ?? "warm",
      },
      update: {
        role: input.role ?? undefined,
        hardMoment: input.hardMoment ?? undefined,
        profileId: input.profileId ?? undefined,
        onboarded: input.onboarded ?? undefined,
        tone: input.tone ?? undefined,
      },
    });
    return this.toProfile(row);
  }

  private toUser(row: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    createdAt: Date;
  }): User {
    return {
      id: row.id,
      email: row.email ?? "",
      name: row.name,
      image: row.image,
      createdAt: row.createdAt,
    };
  }

  private toProfile(row: {
    id: string;
    userId: string;
    role: string | null;
    hardMoment: string | null;
    profileId: string | null;
    onboarded: boolean;
    tone: string;
  }): UserProfile {
    return {
      id: row.id,
      userId: row.userId,
      role: row.role,
      hardMoment: row.hardMoment,
      profileId: row.profileId,
      onboarded: row.onboarded,
      tone: row.tone === "balanced" ? "balanced" : "warm",
    };
  }
}
