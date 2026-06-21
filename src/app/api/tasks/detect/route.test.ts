import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { seedUser } from "@/tests/helpers/db";
import { mockSession } from "@/tests/helpers/auth";
import { createJsonRequest } from "@/tests/helpers/fetch";

describe("POST /api/tasks/detect", () => {
  it("returns 401 when not authenticated", async () => {
    const request = createJsonRequest("http://localhost:3000/api/tasks/detect", "POST", {
      text: "I need to finish the report",
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("detects a task in text", async () => {
    const { user } = await seedUser();
    await mockSession(user);

    const request = createJsonRequest("http://localhost:3000/api/tasks/detect", "POST", {
      text: "I need to finish the report by Friday",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.detected).not.toBeNull();
    expect(data.detected.title).toContain("report");
  });

  it("returns null for casual messages", async () => {
    const { user } = await seedUser();
    await mockSession(user);

    const request = createJsonRequest("http://localhost:3000/api/tasks/detect", "POST", {
      text: "Good morning everyone!",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.detected).toBeNull();
  });

  it("rejects missing text", async () => {
    const { user } = await seedUser();
    await mockSession(user);

    const request = createJsonRequest("http://localhost:3000/api/tasks/detect", "POST", {});

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
