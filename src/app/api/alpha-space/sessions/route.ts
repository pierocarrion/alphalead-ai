import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { getActiveWorkspace } from "@/server/lib/activeWorkspace";
import {
  FRAMEWORKS,
  getFramework,
  getWeeklyLimit,
  startOfWeek,
  generateCoachOpening,
} from "@/server/lib/alphaSpace";
import {
  jsonError,
  parseRequestBody,
  toFriendlyMessage,
} from "@/server/lib/apiErrors";

async function requireLeader() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 }) };
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true },
  });
  if (!user) return { error: NextResponse.json({ error: "Cuenta no encontrada." }, { status: 404 }) };
  const { active } = await getActiveWorkspace(user.id);
  if (!active || (active.role !== "leader" && active.role !== "admin")) {
    return { error: NextResponse.json({ error: "Alpha Space es exclusivo para líderes." }, { status: 403 }) };
  }
  return { user, active };
}

export async function GET() {
  try {
    const auth = await requireLeader();
    if ("error" in auth) return auth.error;
    const { user, active } = auth;

    const sessions = await prisma.alphaSession.findMany({
      where: { userId: user.id, workspaceId: active.workspaceId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        framework: true,
        challenge: true,
        status: true,
        step: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ sessions, frameworks: FRAMEWORKS });
  } catch (error) {
    return jsonError(error);
  }
}

const createSchema = z.object({
  title: z.string().min(1).max(120),
  framework: z.string().default("strategic_dialogue"),
});

export async function POST(request: Request) {
  try {
    const auth = await requireLeader();
    if ("error" in auth) return auth.error;
    const { user, active } = auth;

    const parsed = createSchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json({ error: toFriendlyMessage(parsed.error) }, { status: 400 });
    }
    const framework = getFramework(parsed.data.framework);

    // Weekly limit based on plan
    const sub = await prisma.workspaceSubscription.findUnique({
      where: { workspaceId: active.workspaceId },
      select: { plan: true },
    });
    const plan = sub?.plan ?? "team";
    const limit = getWeeklyLimit(plan);
    const since = startOfWeek();
    const usedThisWeek = await prisma.alphaSession.count({
      where: { userId: user.id, workspaceId: active.workspaceId, createdAt: { gte: since } },
    });
    if (limit <= 0 || usedThisWeek >= limit) {
      return NextResponse.json(
        {
          error:
            limit <= 0
              ? "Alpha Space requiere un plan premium. Actualiza tu suscripción para acceder."
              : `Has alcanzado tu límite de ${limit} sesiones de Alpha Space esta semana.`,
          limit,
          usedThisWeek,
          plan,
        },
        { status: 402 }
      );
    }

    const session = await prisma.alphaSession.create({
      data: {
        userId: user.id,
        workspaceId: active.workspaceId,
        title: parsed.data.title,
        framework: framework.key,
      },
    });

    // Generate opening message from coach
    const opening = await generateCoachOpening({
      leaderName: user.name ?? "Líder",
      framework,
    });
    const openingText = opening.ok && opening.data
      ? opening.data
      : `Bienvenido a Alpha Space. Trabajaremos con el marco "${framework.name}". Para empezar: ${framework.steps[0].goal}. Cuéntame, ¿cuál es la situación en una frase?`;

    await prisma.alphaMessage.create({
      data: {
        sessionId: session.id,
        role: "coach",
        content: openingText,
        meta: { step: 0 },
      },
    });

    return NextResponse.json({
      session,
      opening: openingText,
      usedThisWeek: usedThisWeek + 1,
      limit,
      plan,
    });
  } catch (error) {
    return jsonError(error);
  }
}
