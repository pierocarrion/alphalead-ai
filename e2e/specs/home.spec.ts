import { test, expect } from "../fixtures/auth";

test.describe("Home", () => {
  test("shows the latest open task for demo user", async ({ demoPage }) => {
    await demoPage.goto("/home");
    await expect(demoPage.getByText(/draft the q3 launch deck/i)).toBeVisible();
  });

  test("bottom navigation reaches chat", async ({ demoPage }) => {
    await demoPage.goto("/home");
    await demoPage.getByRole("link", { name: /team/i }).click();
    await expect(demoPage).toHaveURL("/chat");
  });
});
