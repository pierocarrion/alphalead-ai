import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deriveTaskEnhanced, looksLikeTask } from "@/features/tasks/lib/detect";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { text?: string };
  const text = body.text?.trim() ?? "";

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const detected = looksLikeTask(text) ? await deriveTaskEnhanced(text) : null;

  return NextResponse.json({ detected });
}
