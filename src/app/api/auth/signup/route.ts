import { NextResponse } from "next/server";
import {
  SignUpUser,
  signUpUserSchema,
} from "@/features/auth/application/use-cases/SignUpUser";
import { container } from "@/server/lib/container";

const signUpUser = new SignUpUser(container.userRepository);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = signUpUserSchema.parse(body);
    const user = await signUpUser.execute(input);
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
