import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { seedMember, seedUser, seedWorkspace } from "@/tests/helpers/db";
import { mockSession } from "@/tests/helpers/auth";

describe("GET /api/channels/default", () => {
  it("returns 401 when not authenticated", async () => {
    const request = new Request("http://localhost:3000/api/channels/default");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns the default channel for a workspace member", async () => {
    const { user } = await seedMember();
    await mockSession(user);

    const request = new Request("http://localhost:3000/api/channels/default");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.channel.name).toBe("q3-launch");
  });

  it("returns 404 when the user is not a workspace member", async () => {
    await seedWorkspace(); // ensure acme workspace exists
    const { user } = await seedUser();
    await mockSession(user);

    const request = new Request("http://localhost:3000/api/channels/default");
    const response = await GET(request);
    expect(response.status).toBe(404);
  });
});
