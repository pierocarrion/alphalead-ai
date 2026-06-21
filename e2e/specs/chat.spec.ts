import { test, expect } from "../fixtures/auth";

test.describe("Chat", () => {
  test("loads the demo channel and sends a task message", async ({ demoPage }) => {
    await demoPage.goto("/chat");

    await expect(demoPage.getByText("#q3-launch")).toBeVisible();

    const input = demoPage.getByPlaceholder("Message #q3-launch…");
    await input.fill("I need to write the project proposal today");
    await demoPage.keyboard.press("Enter");

    await expect(demoPage.getByText("I need to write the project proposal today")).toBeVisible();
    await expect(demoPage.getByText(/mira heard|looks like a task|start/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("sends a casual message without interception", async ({ demoPage }) => {
    await demoPage.goto("/chat");

    const input = demoPage.getByPlaceholder("Message #q3-launch…");
    await input.fill("Good morning team!");
    await demoPage.keyboard.press("Enter");

    await expect(demoPage.getByText("Good morning team!")).toBeVisible();
  });
});
