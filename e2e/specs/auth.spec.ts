import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("demo user can log in", async ({ page }) => {
    await page.goto("/");

    // Default is signup mode; switch to login
    await page.getByRole("button", { name: /already have an account/i }).click();

    await page.getByPlaceholder("Email").fill("maya@example.com");
    await page.getByPlaceholder("Password").fill("demo1234");
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await expect(page).toHaveURL(/home|onboarding/);
  });

  test("invalid credentials show an error", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /already have an account/i }).click();

    await page.getByPlaceholder("Email").fill("maya@example.com");
    await page.getByPlaceholder("Password").fill("wrong-password");
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await expect(page.getByText(/invalid|credentials|error/i)).toBeVisible();
  });

  test("new user can sign up", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;

    await page.goto("/");
    await page.getByPlaceholder("Your name").fill("E2E User");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill("e2e-password-123");
    await page.getByRole("button", { name: /^create account$/i }).click();

    await expect(page).toHaveURL("/onboarding");
  });
});
