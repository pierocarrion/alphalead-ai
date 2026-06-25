import { test, expect } from "../fixtures/auth";

const DRAFT = {
  title: "Write the launch report",
  fromQuote: "“the launch report”",
  category: "Docs",
  app: "Acme Docs",
  due: "this week",
  load: "Medium" as const,
  micro: "Open the doc and write one rough paragraph.",
  action: "one rough paragraph",
  resource: "Acme Docs",
  selfMade: true,
  confidence: 0.9,
};

test.describe("Ritual", () => {
  test("completes a full ritual flow", async ({ demoPage }) => {
    const res = await demoPage.request.post("/api/tasks", { data: { draft: DRAFT } });
    const { task } = await res.json();

    await demoPage.goto(`/ritual/${task.id}`);
    await expect(demoPage).toHaveURL(/ritual\/.+/, { timeout: 10000 });

    // Unlock step 0: select feeling
    await demoPage.getByText("A little anxious").click();

    // Unlock step 1: validation
    await demoPage.getByRole("button", { name: /ready/i }).click();

    // Unlock step 2: micro-step, start focus
    await demoPage.getByRole("button", { name: /open it with me/i }).click();

    // Focus step
    await expect(demoPage.getByText(/in it now/i)).toBeVisible();
    await demoPage.getByRole("button", { name: /i did/i }).click();

    // Reward step
    await expect(demoPage.getByText("You did it.")).toBeVisible();
    await demoPage.getByRole("button", { name: /back to my day/i }).click();
    await expect(demoPage).toHaveURL("/home");
  });
});
