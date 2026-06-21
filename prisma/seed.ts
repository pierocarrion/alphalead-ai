import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = "demo1234";

const users = [
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
];

const messages = [
  { who: "daniel", text: "Morning all ☀️ Q3 launch is officially a go." },
  { who: "sofia", text: "finally!! been waiting for this 🎉" },
  { who: "theo", text: "love it. what’s the first domino?" },
  { who: "daniel", text: "We want the launch deck ready before Thursday’s sync so marketing can build from it." },
  { who: "daniel", text: "Maya — could you pull together a first rough draft of the Q3 launch deck? Honestly even messy is perfect to start. 🙏", assign: true },
];

async function main() {
  // Clean existing demo data (order matters for FKs)
  await prisma.feedback.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.pairMatch.deleteMany();
  await prisma.userMetric.deleteMany();
  await prisma.teamMetric.deleteMany();
  await prisma.dailyCheckIn.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.knowledgeBaseItem.deleteMany();
  await prisma.template.deleteMany();
  await prisma.methodology.deleteMany();
  await prisma.industryDatabase.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.workspaceSubscription.deleteMany();
  await prisma.ritualSession.deleteMany();
  await prisma.task.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: { in: users.map((u) => u.email) },
    },
  });

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const createdUsers = await Promise.all(
    users.map((u) =>
      prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          passwordHash,
          profile: u.profile
            ? {
                create: {
                  ...u.profile,
                },
              }
            : undefined,
        },
      })
    )
  );

  const maya = createdUsers.find((u) => u.email === "maya@example.com")!;
  const daniel = createdUsers.find((u) => u.email === "daniel@example.com")!;
  const theo = createdUsers.find((u) => u.email === "theo@example.com")!;
  const sofia = createdUsers.find((u) => u.email === "sofia@example.com")!;
  const userMap = new Map(createdUsers.map((u) => [u.name, u.id]));

  const workspace = await prisma.workspace.create({
    data: {
      name: "Acme",
      slug: "acme",
      memberships: {
        create: [
          { userId: maya.id, role: "leader" },
          { userId: daniel.id, role: "member" },
          { userId: sofia.id, role: "member" },
          { userId: theo.id, role: "member" },
          { userId: createdUsers.find((u) => u.email === "priya@example.com")!.id, role: "member" },
        ],
      },
      channels: {
        create: {
          name: "q3-launch",
        },
      },
      subscriptions: {
        create: {
          plan: "team",
          status: "trialing",
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      },
    },
    include: { channels: true },
  });

  const channel = workspace.channels[0];

  const createdMessages = await prisma.message.createManyAndReturn({
    data: messages.map((m, i) => ({
      channelId: channel.id,
      userId: userMap.get(m.who) ?? maya.id,
      content: m.text,
      createdAt: new Date(Date.now() - (messages.length - i) * 60_000),
    })),
  });

  const assignedMessage = createdMessages.find((m) =>
    m.content.toLowerCase().includes("launch deck")
  );

  const goal = await prisma.goal.create({
    data: {
      workspaceId: workspace.id,
      ownerId: maya.id,
      title: "Ship Q3 launch",
      specific: "Launch the Q3 product update with a complete deck, report, and partner comms.",
      measurable: "Deck, report, and partner emails complete by Thursday.",
      achievable: "Yes — team of 5 with clear ownership.",
      relevant: "Critical for Q3 revenue target.",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "active",
      milestones: {
        create: [
          { title: "Rough deck skeleton", dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), status: "pending" },
          { title: "Final report draft", dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), status: "pending" },
        ],
      },
    },
  });

  if (assignedMessage) {
    await prisma.task.create({
      data: {
        userId: maya.id,
        messageId: assignedMessage.id,
        smartGoalId: goal.id,
        title: "Draft the Q3 launch deck",
        fromQuote: "“a first rough draft of the launch deck”",
        category: "Slides",
        app: "Acme Deck Hub",
        due: "before Thursday",
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        load: "Medium",
        micro: "Open the deck and type one messy sentence. That’s the whole job.",
        action: "one messy sentence",
        resource: "Q3 Launch Deck.key",
        selfMade: false,
        status: "open",
        quadrant: "q2",
        estimatedMinutes: 120,
        priority: 4,
        tags: ["launch", "deck"],
      },
    });
  }

  await prisma.task.create({
    data: {
      userId: theo.id,
      smartGoalId: goal.id,
      title: "Build the pricing page",
      category: "Build",
      app: "Acme Tracker",
      due: "this week",
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      load: "Heavy",
      micro: "Open the repo and read the README. That’s all.",
      action: "read the README",
      resource: "pricing-page repo",
      selfMade: false,
      status: "open",
      quadrant: "q1",
      estimatedMinutes: 480,
      priority: 5,
      tags: ["launch", "dev"],
    },
  });

  await prisma.dailyCheckIn.createMany({
    data: [
      { userId: maya.id, mood: "focused", energy: 4 },
      { userId: theo.id, mood: "tired", energy: 2 },
      { userId: sofia.id, mood: "good", energy: 4 },
    ],
  });

  await prisma.teamMetric.createMany({
    data: [
      { workspaceId: workspace.id, type: "mood", value: 0.62, metadata: "A little tense" },
      { workspaceId: workspace.id, type: "load_balance", value: 0.45, metadata: "Theo carrying 2 heavy items" },
      { workspaceId: workspace.id, type: "recovered_minutes", value: 108, metadata: "This week" },
    ],
  });

  await prisma.userMetric.createMany({
    data: [
      { userId: maya.id, type: "recovered_minutes", value: 42 },
      { userId: theo.id, type: "recovered_minutes", value: 18 },
      { userId: sofia.id, type: "recovered_minutes", value: 31 },
    ],
  });

  await prisma.waitlist.createMany({
    data: [
      { email: "alex.founder@example.com", role: "founder", teamSize: "6-20" },
      { email: "sam.manager@example.com", role: "manager", teamSize: "21-50" },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed complete");
  console.log("   Workspace:", workspace.name, workspace.slug);
  console.log("   Channel:", channel.name);
  console.log("   Goal:", goal.title);
  console.log("   Users:", createdUsers.map((u) => u.email).join(", "));
  console.log("   Demo login: maya@example.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
