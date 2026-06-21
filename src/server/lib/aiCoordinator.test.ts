import { describe, expect, it } from "vitest";
import { coordinate, detectTaskFromMessage } from "./aiCoordinator";

describe("detectTaskFromMessage", () => {
  it("returns null for non-task messages", async () => {
    const result = await detectTaskFromMessage({ text: "Good morning!", channelId: "c1" });
    expect(result.detected).toBeNull();
    expect(result.action).toBeNull();
  });

  it("detects tasks and returns an action", async () => {
    const result = await detectTaskFromMessage({
      text: "I need to write the launch report",
      channelId: "c1",
      fromUserId: "u1",
    });
    expect(result.detected).not.toBeNull();
    expect(result.action).not.toBeNull();
    expect(result.action?.agent).toBe("task-detector");
  });
});

describe("coordinate", () => {
  it("routes message_sent events to task detector", async () => {
    const result = await coordinate({
      type: "message_sent",
      userId: "u1",
      workspaceId: "w1",
      payload: { text: "I need to draft the deck", channelId: "c1" },
    });
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.log.some((l) => l.includes("task-detector"))).toBe(true);
  });

  it("routes task_created events to ritual suggester", async () => {
    const result = await coordinate({
      type: "task_created",
      userId: "u1",
      workspaceId: "w1",
      payload: { taskId: "t1" },
    });
    expect(result.actions[0].agent).toBe("ritual-suggester");
  });

  it("routes daily_check events to health check", async () => {
    const result = await coordinate({
      type: "daily_check",
      userId: "u1",
      workspaceId: "w1",
      payload: {},
    });
    expect(result.actions[0].agent).toBe("health-check");
  });
});
