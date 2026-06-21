import { describe, expect, it } from "vitest";
import { PATCH } from "./route";
import { seedUser, getTestPrisma } from "@/tests/helpers/db";
import { mockSession } from "@/tests/helpers/auth";
import { createJsonRequest, callRouteHandler } from "@/tests/helpers/fetch";

async function seedTaskAndRitual(userId: string) {
  const prisma = await getTestPrisma();
  const task = await prisma.task.create({
    data: {
      userId,
      title: "Test task",
      fromQuote: "“test”",
      category: "General",
      app: "Knowledge base",
      micro: "Do the first tiny thing",
      action: "first tiny thing",
      status: "open",
    },
  });
  const ritual = await prisma.ritualSession.create({
    data: {
      userId,
      taskId: task.id,
      durationSec: 120,
      startedAt: new Date(),
    },
  });
  return { task, ritual };
}

describe("PATCH /api/rituals/[id]", () => {
  it("completes the ritual and marks the task as done", async () => {
    const { user } = await seedUser();
    await mockSession(user);
    const { task, ritual } = await seedTaskAndRitual(user.id);

    const request = createJsonRequest(`http://localhost:3000/api/rituals/${ritual.id}`, "PATCH", {
      completed: true,
    });
    const response = await callRouteHandler(PATCH, request, { id: ritual.id });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ritual.completedAt).not.toBeNull();

    const prisma = await getTestPrisma();
    const updatedTask = await prisma.task.findUnique({ where: { id: task.id } });
    expect(updatedTask?.status).toBe("done");
  });

  it("rejects a ritual from another user", async () => {
    const { user } = await seedUser();
    await mockSession(user);
    const otherUser = await (await import("@/tests/helpers/db")).seedUser();
    const { ritual } = await seedTaskAndRitual(otherUser.user.id);

    const request = createJsonRequest(`http://localhost:3000/api/rituals/${ritual.id}`, "PATCH", {
      completed: true,
    });
    const response = await callRouteHandler(PATCH, request, { id: ritual.id });
    expect(response.status).toBe(404);
  });
});
