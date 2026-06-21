import bcrypt from "bcryptjs";
import { z } from "zod";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/User";

export const signUpUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
});

export type SignUpUserInput = z.infer<typeof signUpUserSchema>;

export class SignUpUser {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: SignUpUserInput): Promise<User> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new Error("Email already registered");
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.userRepository.create({
      email: input.email.toLowerCase().trim(),
      name: input.name.trim(),
      passwordHash,
    });
  }
}
