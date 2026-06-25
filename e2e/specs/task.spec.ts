import { test, expect } from "../fixtures/auth";

const DRAFT = {
  title: "Draft the Q3 launch deck",
  fromQuote: "“a first rough draft of the launch deck”",
  category: "Slides",
  app: "Acme Deck Hub",
  due: "before Thursday",
  load: "Medium" as const,
  micro: "Open the deck and type one messy sentence.",
  action: "one messy sentence",
  resource: "Acme Deck Hub",
  selfMade: false,
  confidence: 0.9,
};

test.describe("Task confirmation", () => {
  test("opens the demo task and shows its ritual", async ({ demoPage }) => {
    const res = await demoPage.request.post("/api/tasks", { data: { draft: DRAFT } });
    const { task } = await res.json();

    await demoPage.goto(`/ritual/${task.id}`);

    await expect(demoPage).toHaveURL(/ritual\/.+/, { timeout: 10000 });
    await expect(demoPage.getByText(/launch deck/i).first()).toBeVisible();
  });
});
