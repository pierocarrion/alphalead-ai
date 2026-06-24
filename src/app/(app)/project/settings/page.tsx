import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { getActiveWorkspace } from "@/server/lib/activeWorkspace";
import { ProjectSettingsModule } from "@/features/project-settings/presentation/components/ProjectSettingsModule";

export default async function ProjectSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) redirect("/login");

  const { active } = await getActiveWorkspace(user.id);
  if (!active) redirect("/setup");

  if (active.role !== "leader" && active.role !== "admin") {
    redirect("/home");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: active.workspaceId },
    select: { id: true, name: true, emoji: true },
  });
  if (!workspace) redirect("/home");

  return (
    <ProjectSettingsModule
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      workspaceEmoji={workspace.emoji}
    />
  );
}
