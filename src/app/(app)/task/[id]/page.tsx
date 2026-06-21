import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { TaskConfirmClient } from "./TaskConfirmClient";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/login");

  const { id } = await params;
  const task = await prisma.task.findFirst({
    where: { id, userId: user.id },
  });
  if (!task) notFound();

  const warm = true; // TODO: read from profile tone

  return (
    <TaskConfirmClient
      task={{
        id: task.id,
        title: task.title,
        fromQuote: task.fromQuote ?? "",
        category: task.category,
        app: task.app,
        due: task.due ?? "",
        micro: task.micro,
        resource: task.resource,
        selfMade: task.selfMade,
      }}
      warm={warm}
    />
  );
}
