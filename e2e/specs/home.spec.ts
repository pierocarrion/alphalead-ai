import { test, expect } from "../fixtures/auth";

test.describe("Home", () => {
  test("shows the latest open task for demo user", async ({ demoPage }) => {
    await demoPage.goto("/home");
    await expect(
      demoPage.getByRole("link", { name: /start.*2 minutes/i }).first()
    ).toBeVisible();
  });

  test("bottom navigation reaches chat", async ({ demoPage }) => {
    await demoPage.goto("/home");
    await demoPage.getByRole("link", { name: /team/i }).first().click();
    await expect(demoPage).toHaveURL(/\/chat(\/|$)/);
  });
});
