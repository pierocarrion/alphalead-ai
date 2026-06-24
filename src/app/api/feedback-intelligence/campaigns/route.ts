import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { getActiveWorkspace } from "@/server/lib/activeWorkspace";
import { jsonError } from "@/server/lib/apiErrors";

/** Lista las campañas activas del workspace (para que un miembro responda). */
export async function GET() {
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
    if (!active) return NextResponse.json({ error: "Workspace no encontrado." }, { status: 404 });

    const campaigns = await prisma.feedbackCampaign.findMany({
      where: { workspaceId: active.workspaceId, status: "active" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        kind: true,
        questions: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    return jsonError(error);
  }
}
