import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { MobileNav } from "@/features/auth/presentation/components/MobileNav";
import { DesktopSidebar } from "@/features/navigation/components/DesktopSidebar";

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
    include: { profile: true },
  });

  if (!user?.profile?.onboarded) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-full flex-1">
      {/* Desktop sidebar */}
      <DesktopSidebar />

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
