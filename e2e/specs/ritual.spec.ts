import { test, expect } from "../fixtures/auth";

test.describe("Ritual", () => {
  test("completes a full ritual flow", async ({ demoPage }) => {
    await demoPage.goto("/chat");

    const input = demoPage.getByPlaceholder("Message #q3-launch…");
    await input.fill("I need to write the launch report today");
    await demoPage.keyboard.press("Enter");

    const interception = demoPage.getByText(/mira heard|looks like a task|start/i).first();
    await expect(interception).toBeVisible({ timeout: 5000 });

    await demoPage.getByRole("button", { name: /start|show|task/i }).first().click();
    await expect(demoPage).toHaveURL(/task\/.+/);

    await demoPage.getByRole("button", { name: /start ritual|open it|begin/i }).first().click();
    await expect(demoPage).toHaveURL(/ritual\/.+/);

    // Unlock step 0: select feeling
    await demoPage.getByText("A little anxious").click();

    // Unlock step 1: validation
    await demoPage.getByRole("button", { name: /i'm ready/i }).click();

    // Unlock step 2: micro-step, start focus
    await demoPage.getByRole("button", { name: /open it with me/i }).click();

    // Focus step
    await expect(demoPage.getByText("You're in it now.")).toBeVisible();
    await demoPage.getByRole("button", { name: /i did/i }).click();

    // Reward step
    await expect(demoPage.getByText("You did it.")).toBeVisible();
    await demoPage.getByRole("button", { name: /back to my day/i }).click();
    await expect(demoPage).toHaveURL("/home");
  });
});
