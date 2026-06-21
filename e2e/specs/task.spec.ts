import { test, expect } from "../fixtures/auth";

test.describe("Task confirmation", () => {
  test("navigates from chat interception to task page", async ({ demoPage }) => {
    await demoPage.goto("/chat");

    const input = demoPage.getByPlaceholder("Message #q3-launch…");
    await input.fill("I need to write the launch report today");
    await demoPage.keyboard.press("Enter");

    const interception = demoPage.getByText(/mira heard|looks like a task|start/i).first();
    await expect(interception).toBeVisible({ timeout: 5000 });

    await demoPage.getByRole("button", { name: /start|show|task/i }).first().click();

    await expect(demoPage).toHaveURL(/task\/.+/);
    await expect(demoPage.getByText(/launch report/i).first()).toBeVisible();
  });
});
