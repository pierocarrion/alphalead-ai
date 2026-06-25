import { test as base, expect, Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

export const AUTH_FILE = path.join(__dirname, "../.auth/user.json");

export async function loginAsDemo(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /already have an account/i }).click();
  await page.getByPlaceholder("Email").fill("maya@example.com");
  await page.getByPlaceholder("Password").fill("demo1234");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/home|onboarding/);
}

export const test = base.extend<{
  demoPage: Page;
}>({
  demoPage: async ({ browser }, provide) => {
    fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

    if (!fs.existsSync(AUTH_FILE)) {
      const page = await browser.newPage();
      await loginAsDemo(page);
      await page.context().storageState({ path: AUTH_FILE });
      await page.close();
    }

    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();
    await provide(page);
    await context.close();
  },
});

export { expect };
