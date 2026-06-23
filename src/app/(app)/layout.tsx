import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { getActiveWorkspace } from "@/server/lib/activeWorkspace";
import { MobileNav } from "@/features/auth/presentation/components/MobileNav";
import {
  DesktopSidebar,
  type SidebarChannel,
  type SidebarMember,
  type SidebarWorkspace,
} from "@/features/navigation/components/DesktopSidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      profile: true,
    },
  });

  if (!user?.profile?.onboarded) {
    redirect("/onboarding");
  }

  const { active, memberships } = await getActiveWorkspace(user.id);

  // No project yet -> route the user to setup (create or join based on role).
  if (!active) {
    redirect("/setup");
  }

  const workspaceId = active.workspaceId;
  const userRole = active.role;

  const [workspaceChannels, workspaceMembers, dmChannels, pending] =
    await Promise.all([
      prisma.channel.findMany({
        where: { workspaceId, type: "channel" },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.membership.findMany({
        where: {
          workspaceId,
          userId: { not: user.id },
        },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.channel.findMany({
        where: {
          workspaceId,
          type: "dm",
          participants: { some: { userId: user.id } },
        },
        include: {
          participants: { select: { userId: true } },
        },
      }),
      (userRole === "leader" || userRole === "admin")
        ? prisma.joinRequest.count({
            where: { workspaceId, status: "pending" },
          })
        : Promise.resolve(0),
    ]);

  const channels: SidebarChannel[] = workspaceChannels;
  const members: SidebarMember[] = workspaceMembers.map((m) => ({
    id: m.user.id,
    name: m.user.name ?? "Someone",
  }));
  const dmByPeer: Record<string, string> = {};
  for (const c of dmChannels) {
    const peerId = c.participants.find((p) => p.userId !== user.id)?.userId;
    if (peerId) dmByPeer[peerId] = c.id;
  }

  const workspaces: SidebarWorkspace[] = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    emoji: m.workspace.emoji,
    hashtag: m.workspace.hashtag,
  }));

  const showBackstage = userRole === "leader" || userRole === "admin";

  return (
    <div className="flex h-full flex-1">
      {/* Desktop sidebar */}
      <DesktopSidebar
        workspaceId={workspaceId}
        workspaceName={active.workspaceName}
        workspaceEmoji={active.workspaceEmoji}
        workspaceHashtag={active.workspaceHashtag}
        channels={channels}
        members={members}
        dmByPeer={dmByPeer}
        workspaces={workspaces}
        currentUserId={user.id}
        userName={user.name ?? "you"}
        userRole={userRole}
        showBackstage={showBackstage}
        pendingRequests={pending}
      />

      {/* Main area + mobile nav */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-hidden">{children}</main>
        <div className="lg:hidden">
          <MobileNav />
        </div>
      </div>
    </div>
  );
}
