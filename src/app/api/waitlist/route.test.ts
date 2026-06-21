import { describe, expect, it, beforeEach } from "vitest";
import { POST, GET } from "./route";
import { createJsonRequest } from "@/tests/helpers/fetch";
import { promises as fs } from "fs";
import path from "path";

const WAITLIST_FILE = path.join(process.cwd(), "data", "waitlist.json");

beforeEach(async () => {
  try {
    await fs.unlink(WAITLIST_FILE);
  } catch {
    // ignore
  }
});

describe("POST /api/waitlist", () => {
  it("adds a new entry to the waitlist", async () => {
    const request = createJsonRequest("http://localhost:3000/api/waitlist", "POST", {
      email: "founder@example.com",
      role: "founder",
      teamSize: "6-20",
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("rejects duplicate emails", async () => {
    const body = { email: "founder@example.com", role: "founder", teamSize: "6-20" };
    await POST(createJsonRequest("http://localhost:3000/api/waitlist", "POST", body));
    const response = await POST(createJsonRequest("http://localhost:3000/api/waitlist", "POST", body));
    expect(response.status).toBe(409);
  });

  it("rejects invalid input", async () => {
    const request = createJsonRequest("http://localhost:3000/api/waitlist", "POST", {
      email: "not-an-email",
      role: "",
      teamSize: "",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe("GET /api/waitlist", () => {
  it("returns the waitlist count and entries", async () => {
    await POST(createJsonRequest("http://localhost:3000/api/waitlist", "POST", {
      email: "a@example.com",
      role: "manager",
      teamSize: "1-5",
    }));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(1);
    expect(data.list[0].email).toBe("a@example.com");
  });
});
