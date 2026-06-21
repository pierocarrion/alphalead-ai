import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  CompleteOnboarding,
  completeOnboardingSchema,
} from "@/features/auth/application/use-cases/CompleteOnboarding";
import { container } from "@/server/lib/container";

const completeOnboarding = new CompleteOnboarding(container.userRepository);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await container.userRepository.findByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const input = completeOnboardingSchema.parse({ ...body, userId: user.id });
    const profile = await completeOnboarding.execute(input);
    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
