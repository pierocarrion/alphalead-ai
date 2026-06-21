import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { DayClient } from "./DayClient";

export default async function DayPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email ?? "" },
    include: { profile: true },
  });

  const warm = user?.profile?.tone === "balanced" ? false : true;

  const tasks = await prisma.task.findMany({
    where: { userId: user?.id, status: "open" },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 5,
    select: { id: true, title: true, micro: true },
  });

  const heroTask = tasks[0] ?? null;
  const otherTasks = tasks.slice(1);

  return <DayClient heroTask={heroTask} otherTasks={otherTasks} warm={warm} />;
}
