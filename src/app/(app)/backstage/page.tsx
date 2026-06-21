import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/server/lib/prisma";
import { computeLoadBalance } from "@/server/lib/metrics";
import { personIdFromName } from "@/shared/lib/person";
import { Avatar, Button, Icon } from "@/shared/ui";
import type { PersonId } from "@/shared/ui";

type LoadLevel = "low" | "med" | "high";
type BackstageStatus = "In motion" | "New" | "Heavy";

interface BackstageTask {
  id: string;
  title: string;
  who: PersonId;
  owner: string;
  category: string;
  app: string;
  load: LoadLevel;
  stress: number;
  status: BackstageStatus;
}

const LOAD_TO_LEVEL: Record<string, LoadLevel> = {
  Light: "low",
  Medium: "med",
  Heavy: "high",
};

const LOAD_COLOR: Record<LoadLevel, string> = {
  low: "var(--color-sage)",
  med: "var(--color-accent)",
  high: "var(--color-glow)",
};

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

function toBackstageTask(t: {
  id: string;
  title: string;
  category: string;
  app: string;
  load: string;
  status: string;
  createdAt: Date;
  user: { name: string | null };
}): BackstageTask {
  const level = LOAD_TO_LEVEL[t.load] ?? "low";
  const isNew = Date.now() - t.createdAt.getTime() < TWO_DAYS_MS;
  const status: BackstageStatus =
    level === "high" ? "Heavy" : isNew ? "New" : "In motion";
  return {
    id: t.id,
    title: t.title,
    who: personIdFromName(t.user.name ?? "Someone") as PersonId,
    owner: t.user.name ?? "Someone",
    category: t.category,
    app: t.app,
    load: level,
    stress: level === "high" ? 3 : level === "med" ? 2 : 1,
    status,
  };
}

export default async function BackstagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: true },
  });
  if (!user) redirect("/login");

  const membership = user.memberships[0];
  if (
    !membership ||
    (membership.role !== "leader" && membership.role !== "admin")
  ) {
    redirect("/home");
  }

  const [tasks, load] = await Promise.all([
    prisma.task.findMany({
      where: {
        status: "open",
        user: { memberships: { some: { workspaceId: membership.workspaceId } } },
      },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    computeLoadBalance(membership.workspaceId),
  ]);

  const rows = tasks.map(toBackstageTask);
  const cats = Array.from(new Set(rows.map((r) => r.category)));
  const guardian = load.heavy
    ? {
        who: personIdFromName(load.heavy.name) as PersonId,
        name: load.heavy.name,
        openCount: load.heavy.openCount,
      }
    : null;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[radial-gradient(110%_50%_at_50%_-10%,#221c2c,var(--color-bg)_60%)]">
      {/* Header */}
      <div className="border-b border-line px-6 py-5 pb-4 lg:px-8">
        <div className="flex items-center gap-2.5">
          <Icon name="shield" size={22} color="var(--color-accent)" />
          <h1 className="font-display text-2xl text-ink">Backstage</h1>
        </div>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">
          Mira graded and filed every task she overheard — automatically, so no
          one has to. This routes work and feeds the stress monitor. It is{" "}
          <b className="text-ink">never</b> a public scoreboard.
        </p>
      </div>

      {/* Guardian banner */}
      {guardian && (
        <div className="mx-6 mt-4 flex items-center gap-3.5 rounded-2xl border border-glow bg-gradient-to-b from-glow-soft to-transparent p-4 lg:mx-8">
          <Avatar who={guardian.who} size={38} />
          <div className="flex-1">
            <div className="text-[14.5px] font-bold text-ink">
              {guardian.name} is holding {guardian.openCount} open task
              {guardian.openCount === 1 ? "" : "s"}
            </div>
            <div className="text-xs text-ink-3">
              They procrastinate least, so work drifts to them. Consider
              redistributing before it costs the team.
            </div>
          </div>
          <Button size="sm" href="/crew" className="hidden sm:flex">
            Suggest redistribute
          </Button>
        </div>
      )}

      {/* Categories */}
      <div className="flex flex-col gap-5 px-6 py-5 pb-8 lg:px-8">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center">
            <p className="text-[15px] text-ink-2">
              Nothing open right now. The team is all caught up.
            </p>
          </div>
        ) : (
          cats.map((cat) => {
            const catRows = rows.filter((r) => r.category === cat);
            if (!catRows.length) return null;
            return (
              <div key={cat}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink">
                    {cat}
                  </span>
                  <span className="text-xs text-ink-3">
                    · {catRows.length} · {catRows[0].app}
                  </span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                  <div className="grid grid-cols-[1.7fr_1fr_0.8fr_1fr_0.9fr] gap-3 border-b border-line px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">
                    <span>Task</span>
                    <span>Owner</span>
                    <span>Load</span>
                    <span>Stress impact</span>
                    <span>Status</span>
                  </div>
                  {catRows.map((r) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-[1.7fr_1fr_0.8fr_1fr_0.9fr] items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0"
                    >
                      <span className="text-[14.5px] font-semibold text-ink">
                        {r.title}
                      </span>
                      <span className="flex items-center gap-2">
                        <Avatar who={r.who} size={22} />
                        <span className="text-[13.5px] text-ink-2">{r.owner}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: LOAD_COLOR[r.load] }}
                        />
                        <span className="text-xs capitalize text-ink-3">{r.load}</span>
                      </span>
                      <span className="flex gap-1">
                        {[1, 2, 3].map((n) => (
                          <span
                            key={n}
                            className="h-[5px] w-3.5 rounded-[3px]"
                            style={{
                              background:
                                n <= r.stress
                                  ? "var(--color-accent)"
                                  : "var(--color-line-2)",
                            }}
                          />
                        ))}
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{
                          color:
                            r.status === "Heavy"
                              ? "var(--color-glow)"
                              : r.status === "In motion"
                              ? "var(--color-sage)"
                              : "var(--color-ink-3)",
                        }}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
