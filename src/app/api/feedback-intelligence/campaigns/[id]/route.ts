import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { getActiveWorkspace } from "@/server/lib/activeWorkspace";
import { jsonError, parseRequestBody, toFriendlyMessage } from "@/server/lib/apiErrors";

const patchSchema = z.object({
  status: z.enum(["draft", "active", "closed"]).optional(),
  title: z.string().min(1).max(120).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "Cuenta no encontrada." }, { status: 404 });
    const { active } = await getActiveWorkspace(user.id);
    if (!active || (active.role !== "leader" && active.role !== "admin")) {
      return NextResponse.json({ error: "Exclusivo para líderes." }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.feedbackCampaign.findFirst({
      where: { id, workspaceId: active.workspaceId },
    });
    if (!existing) return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });

    const parsed = patchSchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json({ error: toFriendlyMessage(parsed.error) }, { status: 400 });
    }

    const updated = await prisma.feedbackCampaign.update({
      where: { id },
      data: { status: parsed.data.status, title: parsed.data.title },
    });
    return NextResponse.json({ campaign: updated });
  } catch (error) {
    return jsonError(error);
  }
}
