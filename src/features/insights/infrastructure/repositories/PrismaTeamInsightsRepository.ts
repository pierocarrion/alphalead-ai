import { prisma } from "@/server/lib/prisma";
import type {
  ITeamInsightsRepository,
  RawCheckInRow,
  RawFeedbackRow,
  RawSurveyRow,
  RawTaskRow,
  EmployeeActivityRow,
} from "../../domain/repositories/ITeamInsightsRepository";
import type { EmployeeWithMetrics } from "../../domain/entities/Employee";
import type { LearningActivity, SkillCell, SkillLevel } from "../../domain/entities/Learning";
import type { TeamInsightsFilters } from "../../domain/entities/TeamOverview";
import type { EmotionalState, Seniority } from "../../domain/entities/Employee";

function toSkillLevel(level: string | null | undefined): SkillLevel {
  if (level === "beginner" || level === "intermediate" || level === "advanced" || level === "expert") {
    return level;
  }
  return "beginner";
}

function toSentiment(score: number): EmotionalState {
  if (score >= 66) return "positive";
  if (score >= 40) return "neutral";
  return "risk";
}

export class PrismaTeamInsightsRepository implements ITeamInsightsRepository {
  async getTeamName(workspaceId: string): Promise<string> {
    const ws = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });
    return ws?.name ?? "Equipo";
  }

  async listMembers(
    workspaceId: string,
    filters?: TeamInsightsFilters
  ): Promise<EmployeeWithMetrics[]> {
    const where: Record<string, unknown> = {
      workspaceId,
      status: "active",
    };
    if (filters?.seniority) where.seniority = filters.seniority;
    if (filters?.position) where.projectRole = filters.position;

    const memberships = await prisma.membership.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    const since = filters?.since ? new Date(filters.since) : undefined;

    const [tasks, surveys, feedback, learning] = await Promise.all([
      this.listTasks(workspaceId, since),
      this.listSurveys(workspaceId, since),
      this.listFeedback(workspaceId, since),
      this.listLearning(workspaceId, since),
    ]);

    const members = memberships.map((m) => {
      const memberTasks = tasks.filter((t) => t.userId === m.userId);
      const memberSurveys = surveys.filter((s) => s.userId === m.userId);
      const memberFeedback = feedback.filter((f) => f.userId === m.userId);
      const memberLearning = learning.filter((l) => l.employeeId === m.userId);

      const completedTasks = memberTasks.filter(
        (t) => t.status === "done" || t.status === "completed"
      ).length;
      const activeTasks = memberTasks.filter(
        (t) => t.status !== "done" && t.status !== "completed"
      ).length;
      const estimatedHours =
        memberTasks.reduce((a, t) => a + (t.estimatedMinutes ?? 0), 0) / 60;
      const workedHours =
        memberTasks.reduce((a, t) => a + (t.workedMinutes ?? 0), 0) / 60;
      const progressPct =
        memberTasks.length === 0
          ? 0
          : Math.round((completedTasks / memberTasks.length) * 1000) / 10;
      const learningProgress =
        memberLearning.length === 0
          ? 0
          : Math.round(
              (memberLearning.filter((l) => l.completedAt).length /
                memberLearning.length) *
                1000
            ) / 10;

      const positive =
        memberSurveys.filter((s) => s.sentiment === "positive").length +
        memberFeedback.filter((f) => (f.score ?? 0) >= 4).length;
      const risk =
        memberSurveys.filter((s) => s.sentiment === "risk").length +
        memberFeedback.filter((f) => (f.score ?? 0) <= 2).length;
      const total = memberSurveys.length + memberFeedback.length;
      const sentimentScore =
        total === 0 ? 60 : Math.round((50 + ((positive - risk) / total) * 50) * 10) / 10;
      const sentiment = toSentiment(sentimentScore);

      const employee: EmployeeWithMetrics = {
        id: m.userId,
        name: m.user.name ?? "Colaborador",
        photo: m.photoUrl ?? m.user.image ?? null,
        position: m.projectRole ?? null,
        team: workspaceId,
        role: m.role,
        seniority: (m.seniority as Seniority | null) ?? null,
        hireDate: m.hireDate ?? m.joinedAt,
        employeeId: m.userId,
        activeTasks,
        completedTasks,
        workedHours: Math.round(workedHours * 10) / 10,
        estimatedHours: Math.round(estimatedHours * 10) / 10,
        progressPct,
        learningProgress,
        sentimentScore,
        sentiment,
      };
      return employee;
    });

    return this.applyPostFilters(members, filters);
  }

  private applyPostFilters(
    members: EmployeeWithMetrics[],
    filters?: TeamInsightsFilters
  ): EmployeeWithMetrics[] {
    let result = members;
    if (filters?.sentiment) {
      result = result.filter((m) => m.sentiment === filters.sentiment);
    }
    return result;
  }

  async listTasks(workspaceId: string, since?: Date): Promise<RawTaskRow[]> {
    const rows = await prisma.task.findMany({
      where: {
        user: {
          memberships: { some: { workspaceId } },
        },
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      select: {
        id: true,
        userId: true,
        status: true,
        estimatedMinutes: true,
        workedMinutes: true,
        createdAt: true,
        completedAt: true,
        deadline: true,
      },
    });
    return rows as RawTaskRow[];
  }

  async listFeedback(workspaceId: string, since?: Date): Promise<RawFeedbackRow[]> {
    const rows = await prisma.feedback.findMany({
      where: {
        workspaceId,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      select: {
        userId: true,
        type: true,
        metricValue: true,
        createdAt: true,
      },
    });
    return rows.map((r) => ({
      userId: r.userId,
      score: r.metricValue,
      metricValue: r.metricValue,
      type: r.type,
      createdAt: r.createdAt,
    }));
  }

  async listSurveys(workspaceId: string, since?: Date): Promise<RawSurveyRow[]> {
    const rows = await prisma.survey.findMany({
      where: {
        workspaceId,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      select: {
        userId: true,
        psychologicalSafety: true,
        sentiment: true,
        createdAt: true,
      },
    });
    return rows as RawSurveyRow[];
  }

  async listCheckIns(workspaceId: string, since?: Date): Promise<RawCheckInRow[]> {
    const rows = await prisma.dailyCheckIn.findMany({
      where: {
        user: {
          memberships: { some: { workspaceId } },
        },
        ...(since ? { date: { gte: since } } : {}),
      },
      select: {
        userId: true,
        date: true,
        mood: true,
        energy: true,
      },
    });
    return rows as RawCheckInRow[];
  }

  async listLearning(
    workspaceId: string,
    since?: Date
  ): Promise<LearningActivity[]> {
    const rows = await prisma.learningActivity.findMany({
      where: {
        workspaceId,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      employeeId: r.userId,
      type: r.type,
      title: r.title,
      skill: r.skill,
      level: toSkillLevel(r.level),
      hours: r.hours,
      completedAt: r.completedAt,
      createdAt: r.createdAt,
    }));
  }

  async listSkills(workspaceId: string): Promise<SkillCell[]> {
    const rows = await prisma.employeeSkill.findMany({
      where: { workspaceId },
      include: { user: { select: { name: true } } },
    });
    return rows.map((r) => ({
      employeeId: r.userId,
      employeeName: r.user.name ?? "Colaborador",
      skill: r.skill,
      level: toSkillLevel(r.level),
    }));
  }

  async listMeetingsAttended(
    workspaceId: string,
    since?: Date
  ): Promise<RawCheckInRow[]> {
    return this.listCheckIns(workspaceId, since);
  }

  async countMeetingsTotal(workspaceId: string, since?: Date): Promise<number> {
    const count = await prisma.meeting.count({
      where: {
        workspaceId,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
    });
    return count;
  }

  async listEmployeeActivity(
    workspaceId: string,
    employeeId: string,
    limit = 30
  ): Promise<EmployeeActivityRow[]> {
    const [learning, tasks, feedback, meetings] = await Promise.all([
      prisma.learningActivity.findMany({
        where: { workspaceId, userId: employeeId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.task.findMany({
        where: { userId: employeeId, status: { in: ["done", "completed"] } },
        orderBy: { completedAt: "desc" },
        take: limit,
      }),
      prisma.feedback.findMany({
        where: { workspaceId, userId: employeeId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.meeting.findMany({
        where: { workspaceId, ownerId: employeeId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    const activity: EmployeeActivityRow[] = [];
    for (const l of learning) {
      activity.push({
        id: l.id,
        type: l.type === "certification" ? "certification" : "course",
        title: l.title,
        detail: l.completedAt ? "Completado" : "En progreso",
        occurredAt: l.completedAt ?? l.createdAt,
      });
    }
    for (const t of tasks) {
      activity.push({
        id: t.id,
        type: "task",
        title: t.title,
        detail: "Tarea finalizada",
        occurredAt: t.completedAt ?? t.createdAt,
      });
    }
    for (const f of feedback) {
      activity.push({
        id: f.id,
        type: "feedback",
        title: f.content.slice(0, 80),
        detail: f.type,
        occurredAt: f.createdAt,
      });
    }
    for (const mt of meetings) {
      activity.push({
        id: mt.id,
        type: "meeting",
        title: mt.title,
        detail: mt.status,
        occurredAt: mt.scheduledAt ?? mt.createdAt,
      });
    }
    return activity.sort(
      (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()
    );
  }
}
