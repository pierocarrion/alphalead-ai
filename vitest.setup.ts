import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import { resetDatabase, setupTestDatabase } from "@/tests/helpers/db";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

await setupTestDatabase();

afterEach(async () => {
  await resetDatabase();
});
