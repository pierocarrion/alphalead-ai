import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { ChatClient } from "./ChatClient";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) redirect("/login");

  const workspace = await prisma.workspace.findUnique({
    where: { slug: "acme" },
    include: {
      channels: { where: { name: "q3-launch" }, take: 1 },
      memberships: { where: { userId: user.id } },
    },
  });

  const channel = workspace?.channels[0];
  if (!channel || !workspace?.memberships.length) redirect("/home");

  return <ChatClient channelId={channel.id} channelName={channel.name} />;
}
