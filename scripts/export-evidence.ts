import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const [
    waitlistCount,
    userCount,
    taskCount,
    ritualCount,
    recoveredMinutes,
    feedback,
  ] = await Promise.all([
    prisma.waitlist.count(),
    prisma.user.count(),
    prisma.task.count(),
    prisma.ritualSession.count(),
    prisma.userMetric
      .aggregate({ where: { type: "recovered_minutes" }, _sum: { value: true } })
      .then((r) => r._sum.value ?? 0),
    prisma.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      waitlistCount,
      userCount,
      taskCount,
      ritualCount,
      recoveredMinutes,
      feedbackCount: feedback.length,
    },
    testimonials: feedback
      .filter((f) => f.type === "testimonial")
      .map((f) => ({ content: f.content, tags: f.tags, createdAt: f.createdAt })),
    wins: feedback
      .filter((f) => f.type === "win")
      .map((f) => ({ content: f.content, metricValue: f.metricValue, createdAt: f.createdAt })),
    struggles: feedback
      .filter((f) => f.type === "struggle")
      .map((f) => ({ content: f.content, createdAt: f.createdAt })),
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
