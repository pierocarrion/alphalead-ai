import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();
    await prisma.ritualSession.deleteMany();
    await prisma.task.deleteMany();
    await prisma.message.deleteMany();
    await prisma.channel.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "maya@example.com",
            "daniel@example.com",
            "sofia@example.com",
            "theo@example.com",
            "priya@example.com",
          ],
        },
      },
    });

    const passwordHash = await bcrypt.hash("demo1234", 10);

    const users = await Promise.all(
      [
        {
          name: "Maya",
          email: "maya@example.com",
          profile: {
            role: "Product Manager",
            hardMoment: "Starting when a task feels vague",
            profileId: "curious-starter",
            onboarded: true,
            tone: "warm",
          },
        },
        { name: "Daniel", email: "daniel@example.com" },
        { name: "Sofía", email: "sofia@example.com" },
        { name: "Theo", email: "theo@example.com" },
        { name: "Priya", email: "priya@example.com" },
      ].map((u) =>
        prisma.user.create({
          data: {
            name: u.name,
            email: u.email,
            passwordHash,
            profile: u.profile ? { create: u.profile } : undefined,
          },
        })
      )
    );

    const maya = users.find((u) => u.email === "maya@example.com")!;
    const userMap = new Map(users.map((u) => [u.name, u.id]));

    const workspace = await prisma.workspace.create({
      data: {
        name: "Acme",
        slug: "acme",
        memberships: {
          create: users.map((u) => ({ userId: u.id, role: "member" })),
        },
        channels: { create: { name: "q3-launch" } },
      },
      include: { channels: true },
    });

    const channel = workspace.channels[0];

    const messages = await prisma.message.createManyAndReturn({
      data: [
        {
          channelId: channel.id,
          userId: userMap.get("Daniel")!,
          content: "Morning all ☀️ Q3 launch is officially a go.",
          createdAt: new Date(Date.now() - 4 * 60_000),
        },
        {
          channelId: channel.id,
          userId: userMap.get("Sofía")!,
          content: "finally!! been waiting for this 🎉",
          createdAt: new Date(Date.now() - 3 * 60_000),
        },
        {
          channelId: channel.id,
          userId: userMap.get("Theo")!,
          content: "love it. what’s the first domino?",
          createdAt: new Date(Date.now() - 2 * 60_000),
        },
        {
          channelId: channel.id,
          userId: userMap.get("Daniel")!,
          content: "We want the launch deck ready before Thursday’s sync so marketing can build from it.",
          createdAt: new Date(Date.now() - 1 * 60_000),
        },
        {
          channelId: channel.id,
          userId: userMap.get("Daniel")!,
          content: "Maya — could you pull together a first rough draft of the Q3 launch deck? Honestly even messy is perfect to start. 🙏",
          createdAt: new Date(),
        },
      ],
    });

    const assignedMessage = messages.find((m) =>
      m.content.toLowerCase().includes("launch deck")
    );

    if (assignedMessage) {
      await prisma.task.create({
        data: {
          userId: maya.id,
          messageId: assignedMessage.id,
          title: "Draft the Q3 launch deck",
          fromQuote: "“a first rough draft of the launch deck”",
          category: "Slides",
          app: "Acme Deck Hub",
          due: "before Thursday",
          load: "Medium",
          micro: "Open the deck and type one messy sentence. That’s the whole job.",
          action: "one messy sentence",
          resource: "Q 3 Launch Deck.key",
          selfMade: false,
          status: "open",
        },
      });
    }

    console.log("✅ E2E seed complete");
  } catch (error) {
    console.error("E2E setup failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

export default main;
