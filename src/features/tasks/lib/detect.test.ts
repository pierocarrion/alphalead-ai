import { describe, expect, it } from "vitest";
import { deriveTask, estimateLoad, looksLikeAssignment, looksLikeTask } from "./detect";

describe("looksLikeTask", () => {
  it("detects task-like messages", () => {
    expect(looksLikeTask("I need to finish the Q3 report by Friday")).toBe(true);
    expect(looksLikeTask("Can you draft the launch deck?")).toBe(true);
    expect(looksLikeTask("Please send the email before the meeting")).toBe(true);
    expect(looksLikeTask("We should fix the login bug tomorrow")).toBe(true);
  });

  it("ignores casual chat", () => {
    expect(looksLikeTask("Morning all ☀️")).toBe(false);
    expect(looksLikeTask("finally!! been waiting for this 🎉")).toBe(false);
    expect(looksLikeTask("love it. what's the first domino?")).toBe(false);
  });

  it("is case insensitive", () => {
    expect(looksLikeTask("I NEED TO WRITE THE REPORT")).toBe(true);
  });
});

describe("deriveTask", () => {
  it("categorizes slide tasks", () => {
    const task = deriveTask("I need to prepare the Q3 launch deck");
    expect(task.category).toBe("Slides");
    expect(task.app).toBe("Google Slides");
    expect(task.resource).toBe("Untitled presentation");
  });

  it("categorizes doc tasks", () => {
    const task = deriveTask("Please write the project spec");
    expect(task.category).toBe("Docs");
    expect(task.app).toBe("Google Docs");
  });

  it("categorizes communication tasks", () => {
    const task = deriveTask("Send the update email to the team");
    expect(task.category).toBe("Comms");
    expect(task.app).toBe("Gmail");
  });

  it("categorizes build tasks", () => {
    const task = deriveTask("Fix the navigation bug before release");
    expect(task.category).toBe("Build");
    expect(task.app).toBe("Google Tasks");
  });

  it("truncates long titles", () => {
    const longText =
      "I really need to finish writing the whole proposal document and review every single section before tomorrow morning";
    const task = deriveTask(longText);
    expect(task.title.endsWith("…")).toBe(true);
  });

  it("truncates long quotes", () => {
    const longText = "a".repeat(100);
    const task = deriveTask(longText);
    expect(task.fromQuote).toContain("…");
  });

  it("provides sensible defaults", () => {
    const task = deriveTask("Something random");
    expect(task.category).toBe("General");
    expect(task.load).toBe("Light");
    expect(task.selfMade).toBe(true);
  });

  it("detects assignments", () => {
    expect(looksLikeAssignment("Maya, can you draft the report?")).toBe(true);
    expect(looksLikeAssignment("I need to finish the report")).toBe(false);
  });

  it("estimates load", () => {
    expect(estimateLoad("I need to rewrite the whole auth system from scratch")).toBe("Heavy");
    expect(estimateLoad("Please prepare the Q3 launch deck")).toBe("Medium");
    expect(estimateLoad("Send a quick update email")).toBe("Light");
  });

  it("extracts deadlines", () => {
    const task = deriveTask("I need to finish the report by tomorrow");
    expect(task.due).toBe("tomorrow");
    expect(task.deadline).not.toBeNull();
  });
});
