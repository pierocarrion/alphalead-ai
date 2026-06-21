import { test, expect } from "@playwright/test";

test.describe("Onboarding", () => {
  test("new user completes onboarding", async ({ page }) => {
    const email = `onboarding-${Date.now()}@example.com`;

    await page.goto("/");
    await page.getByRole("button", { name: /need an account/i }).click();
    await page.getByPlaceholder("Your name").fill("Onboarding User");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill("e2e-password-123");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL("/onboarding");

    const rail = page.getByTestId("onboarding-rail");
    const vw = page.viewportSize()?.width ?? 0;
    if (vw >= 1024) {
      await expect(rail).toBeVisible();
    } else {
      await expect(rail).not.toBeVisible();
    }

    await page.getByText("I build / make").click();
    await page.getByRole("button", { name: /continue/i }).click();

    await page.getByText("Mornings — facing the day").click();
    await page.getByRole("button", { name: /continue/i }).click();

    await page.getByText("Too many things — I freeze").click();
    await page.getByRole("button", { name: /continue/i }).click();

    await page.getByRole("button", { name: /take me in/i }).click();

    await expect(page).toHaveURL("/home");
  });
});
