import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { NightClient } from "./NightClient";

export default async function NightPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email ?? "" },
    include: { profile: true },
  });

  const warm = user?.profile?.tone === "balanced" ? false : true;
  const name = user?.name?.split(" ")[0] ?? "Maya";

  return <NightClient warm={warm} name={name} />;
}
