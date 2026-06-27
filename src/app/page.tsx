// ─────────────────────────────────────────────────────────────────────────────
// AlphaLead AI — Landing Page (page.tsx)
// SEO-optimized: primary keyword "team management tools" | KD 18 | Vol 590
// FAQ JSON-LD schema included for Google rich results
// Image: copy /uploads/alpha-lead-ai-autonomous-team-chat-interface_webp.png
//        → /public/alpha-lead-ai-dashboard.webp
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import Link from "next/link";
import { Alpha } from "@/shared/ui";
import { WaitlistForm } from "@/features/marketing/components/WaitlistForm";
import { landingStructuredData } from "@/features/marketing/seo/structured-data";
import { absoluteUrl, siteName } from "@/shared/lib/site";

// ─── SEO METADATA ─────────────────────────────────────────────────────────────
// Primary keyword: "team management tools" placed in H1, title, description
// Secondary: "workplace management solutions" (KD 12), "ai task prioritization"
//            "team management software" (KD 27, Vol 2400), "sprint planning"
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_DESCRIPTION =
  "AlphaLead AI gives every team member a clear first step, surfaces anonymous blockers, and eliminates standups — without surveillance. The only team management app built async from day one.";

export const metadata: Metadata = {
  title: "AlphaLead AI — Team Management Tools That End Choice Paralysis",
  description: PAGE_DESCRIPTION,
  keywords: [
    "team management tools",
    "team management software",
    "ai task prioritization",
    "workplace management solutions",
    "project management tools for remote teams",
    "automated task manager",
    "remote team management tools",
    "virtual team management tools",
    "team productivity tools",
    "support software for product teams",
    "team management app",
    "sprint planning",
    "choice paralysis",
    "task prioritization",
    "stop team procrastination",
    "assignment tracker",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    siteName,
    title: "AlphaLead AI — Team Management Tools That End Choice Paralysis",
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/alpha-lead-ai-dashboard.webp"),
        width: 1280,
        height: 720,
        alt: "Alpha Lead AI team management tools dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AlphaLead AI — Team Management Tools That End Choice Paralysis",
    description: PAGE_DESCRIPTION,
  },
};

// ─── FAQ DATA — drives both JSON-LD schema and the accordion UI ───────────────
const faqItems = [
  {
    q: "Is this a replacement for Jira, Asana, or Linear?",
    a: "No. Alpha Lead AI works alongside your existing project management tools — it does not replace them. Think of it as the decision and momentum layer that sits on top of your task manager. Your tickets live in Jira or Linear; Alpha Lead reads that context and tells each person what to focus on first.",
  },
  {
    q: "How is the anonymous blocker flag different from messaging my manager?",
    a: "When you message your manager, it creates a social signal — you are visibly stuck. The anonymous blocker flag sends no individual notification. Your manager sees that the team has active blockers as an aggregate number, not a named list. The peer who gets matched to help receives context but not your name unless you choose to share it.",
  },
  {
    q: "How does AI task prioritization decide what to surface first?",
    a: "The AI reads sprint context: open tasks, declared blockers, teammate dependencies, your stated capacity, and deadline proximity. It then ranks your personal queue by impact — tasks that unblock others or sit on the critical path come first. You can override any suggestion at any time. The goal is to remove blank-page paralysis, not remove your judgment.",
  },
  {
    q: "Does this work for non-engineering teams?",
    a: "Yes. Alpha Lead is built for any team with high digital work density — product managers, marketing ops, design leads, analytics teams. The task prioritization and async standup features work for any role. The peer-matching logic adapts to whatever type of blocker your team most commonly faces.",
  },
  {
    q: "What does the free plan actually include?",
    a: "The free plan supports up to 5 users with no expiry date and no credit card required. It includes AI task prioritization, unlimited anonymous blocker flags, and one async standup team. It is a fully working product, not a countdown trial.",
  },
  {
    q: "How is Alpha Lead priced differently from Atlassian, Motion, or GitHub Copilot?",
    a: "Those platforms bill a base seat fee plus variable AI credit consumption — when your team ships more, your bill spikes. Alpha Lead charges one flat rate per team per month with no credit system and no overage charges. Your costs are the same whether it is a quiet planning week or a sprint crunch.",
  },
];

// ─── COMPARISON DATA ──────────────────────────────────────────────────────────
const comparisonRows = [
  {
    feature: "Works inside your current stack — no migration, no replacement",
    taskTools: "✗ Needs migration",
    comms: "✓ Is your stack",
    monitoring: "✗ Parallel layer",
    alpha: "✓ Layers on top",
  },
  {
    feature: "Merges multiple communication channels into one AI context layer",
    taskTools: "✗",
    comms: "Partial",
    monitoring: "✗",
    alpha: "✓ Unified context",
  },
  {
    feature: "Ask for help without feeling ashamed or exposed",
    taskTools: "✗",
    comms: "✗",
    monitoring: "✗",
    alpha: "✓ Anonymous flag",
  },
  {
    feature: "AI task prioritization — one clear first step every morning",
    taskTools: "✗ Manual triage",
    comms: "✗",
    monitoring: "✗",
    alpha: "✓ Context-aware AI",
  },
  {
    feature: "Real feedback loops for leaders AND teammates",
    taskTools: "Leaders only",
    comms: "✗",
    monitoring: "Leaders only",
    alpha: "✓ Both sides",
  },
  {
    feature: "Alpha Space: templates, coaching & matrix canvas (export-ready)",
    taskTools: "✗",
    comms: "✗",
    monitoring: "✗",
    alpha: "✓ Included",
  },
  {
    feature: "Knowledge base fed by AI + collaborators — built from real chats",
    taskTools: "✗",
    comms: "✗",
    monitoring: "✗",
    alpha: "✓ Living KB",
  },
  {
    feature: "Extract & save templates directly from team conversations",
    taskTools: "✗",
    comms: "✗",
    monitoring: "✗",
    alpha: "✓ Auto-extracted",
  },
  {
    feature: "No individual surveillance or performance monitoring",
    taskTools: "✓",
    comms: "✓",
    monitoring: "✗ Full monitoring",
    alpha: "✓ Anonymous-first",
  },
  {
    feature: "Flat pricing — no AI credit overages when your team ships more",
    taskTools: "✗ Per-seat + credits",
    comms: "Partial",
    monitoring: "Varies",
    alpha: "✓ Flat per team",
  },
];

// ─── SCHEMAS ──────────────────────────────────────────────────────────────────
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const jsonLd = landingStructuredData();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* JSON-LD: landing page + FAQ rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ─── NAV ───────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-bg/90 px-6 py-4 backdrop-blur lg:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <Alpha size={32} mood="happy" />
          <span className="font-display text-xl text-ink">AlphaLead</span>
        </Link>

        {/* Desktop nav links — Home / Features / Pricing / Blog */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-semibold text-ink-2 transition hover:text-ink"
          >
            Home
          </Link>
          <Link
            href="#features"
            className="text-sm font-semibold text-ink-2 transition hover:text-ink"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-semibold text-ink-2 transition hover:text-ink"
          >
            Pricing
          </Link>
          <Link
            href="/blog"
            className="text-sm font-semibold text-ink-2 transition hover:text-ink"
          >
            Blog
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/demo"
            className="hidden text-sm font-semibold text-accent transition hover:opacity-80 sm:block"
          >
            Book a demo
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line-2)] transition hover:bg-surface-2"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* ─── HERO — above the fold, primary CTA visible immediately ────────── */}
      <section className="flex flex-col items-center px-6 pt-16 pb-20 text-center lg:px-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-surface px-4 py-1.5 text-xs font-bold text-ink-2">
          <span className="h-2 w-2 rounded-full bg-sage" />
          Built for teams that want to move — not just manage
        </div>

        {/* H1 — primary SEO keyword: "team management tools" */}
        <h1 className="mt-6 max-w-3xl font-display text-[42px] leading-[1.05] text-ink sm:text-[56px] lg:text-[72px]">
          Team management tools that end choice&nbsp;paralysis.
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
          Alpha Lead AI tells your team what to work on first, surfaces who is
          blocked, and kills the standup — before it kills your morning. No
          surveillance. No extra meetings. Just momentum.
        </p>

        {/* Two-button CTA structure — primary (high intent) + secondary (low intent) */}
        {/* Arrow → increases CTR by up to 26% */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <WaitlistForm buttonText="Boost my team's output →" />
          <Link
            href="#features"
            className="rounded-full border border-line-2 bg-surface px-6 py-3 text-sm font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line-2)] transition hover:bg-surface-2"
          >
            See how it works →
          </Link>
        </div>
        <p className="mt-4 text-xs text-ink-3">
          Up to 5 seats free, forever · No credit card required
        </p>

        {/* Hero dashboard image — swap for short video loop when ready */}
        {/* DEVELOPER: copy uploaded screenshot → /public/alpha-lead-ai-dashboard.webp */}
        <div className="mt-16 w-full max-w-5xl overflow-hidden rounded-[28px] border border-line-2 shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/alpha-lead-ai-autonomous-team-chat-interface.webp"
            alt="Alpha Lead AI team management tools dashboard showing AI task queue, anonymous blocker flag, and async standup summary for a remote dev team"
            width={1280}
            height={768}
            className="w-full"
            loading="eager"
            decoding="async"
          />
        </div>
      </section>

      {/* ─── INTEGRATION BAR ────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-bg-2 px-6 py-6">
        <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
          Works inside the tools your team already lives in
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-8">
          {["Slack", "Linear", "Notion", "GitHub", "Jira", "Asana"].map(
            (tool) => (
              <span
                key={tool}
                className="text-sm font-semibold text-ink-3 opacity-60"
              >
                {tool}
              </span>
            ),
          )}
        </div>
      </section>

      {/* ─── PROBLEM STATS ──────────────────────────────────────────────────── */}
      {/* H2 keyword: "choice paralysis" — KD 40, Vol 9,900 */}
      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-display text-[28px] text-ink sm:text-[36px]">
            Choice paralysis is killing your team&apos;s output.
            <br />
            <span className="text-ink-2">Your task manager is helping it.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-ink-2">
            You already have Jira, Slack, Notion, and Linear. And yet every
            Monday the sprint backlog is full, the standup runs long, and by
            10am nobody is sure what to actually start first. That is not a tool
            problem. That is a task prioritization problem — and no kanban board
            will fix it.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <StatCard
              value="131"
              label="minutes lost per employee per day to context switching and task paralysis"
            />
            <StatCard
              value="$10K"
              label="average annual cost per employee from procrastination and blocked work"
            />
            <StatCard
              value="35%"
              label="more missed deadlines in teams without clear AI task prioritization"
            />
          </div>
        </div>
      </section>

      {/* ─── PROBLEM DEEP DIVE ──────────────────────────────────────────────── */}
      <section className="border-y border-line bg-bg-2 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-3">
            <ProblemCard
              title="The context-switching tax"
              desc="Every Slack ping, reassigned ticket, or quick question costs 23 minutes of recovery time. Your current team management tools document this after the fact — they were never built to prevent it."
            />
            <ProblemCard
              title="The blank-page paralysis"
              desc="88% of workers admit to procrastinating at least one hour per day. When the task list has 20 open items and no clear signal about which one matters right now, the brain defaults to avoidance."
            />
            <ProblemCard
              title="The surveillance trap"
              desc="68% of employees actively resist AI-based monitoring. 42% of digitally monitored workers plan to quit within 12 months. Adding bossware to a struggling team destroys the trust holding it together."
            />
          </div>
        </div>
      </section>

      {/* ─── SOLUTION / FEATURES ────────────────────────────────────────────── */}
      {/* H2 keyword: "workplace management solutions" — KD 12, Vol 260 */}
      <section id="features" className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-accent">
            Workplace management solutions
          </p>
          <h2 className="mt-3 text-center font-display text-[28px] text-ink sm:text-[36px]">
            Built for the moment your team gets stuck.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-ink-2">
            Most team productivity tools give you better visibility into work
            that has already stalled. Alpha Lead AI intervenes at the moment
            friction starts — the support software for product teams, dev teams,
            and distributed leads who need momentum, not just metrics.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* H3 keyword: "ai task prioritization" — KD 15, Vol 50 */}
            <FeatureCard
              tag="AI task prioritization"
              title="No more blank sprint mornings"
              desc="Alpha Lead reads your sprint context — open tickets, capacity, blockers, dependencies — and surfaces a ranked task queue for each team member every morning. No manual triage. No 'what should I work on?' messages in Slack."
            />
            <FeatureCard
              tag="Anonymous blocker flag"
              title="Visibility without surveillance"
              desc="When a team member is stuck, they raise a silent flag. No manager notification. No performance log. The AI matches them with the right peer — anonymously, asynchronously, without creating a new meeting."
            />
            {/* H3 keyword: "automated task manager" — KD 26, Vol 30 */}
            <FeatureCard
              tag="Automated task manager"
              title="Async standups — half the time"
              desc="2-minute async check-in. Alpha Lead synthesizes responses, flags real blockers, groups context, and delivers a team summary to the lead — with zero screen time inside a calendar invite."
            />
            <FeatureCard
              tag="Alpha Space"
              title="Templates, coaching & matrix canvas"
              desc="Leaders get AI-powered coaching frameworks, analysis tools, and matrix canvases. Define strategy, run retrospectives, build action plans — then export polished documents in seconds. Fast production, zero blank pages."
            />
            <FeatureCard
              tag="AI + team knowledge base"
              title="Built by your team, amplified by AI"
              desc="Alpha saves templates directly from chat, extracts decisions, and builds a living knowledge base fed by both AI and your collaborators. Never lose a good process or miss a follow-up again — without micromanaging a single teammate."
            />
            <FeatureCard
              tag="Pair-start"
              title="Co-start to break the freeze"
              desc="When someone is stuck, Alpha matches them with a teammate to start together. Peer momentum replaces manager pressure — and the work actually gets done."
            />
          </div>

          {/* Repeated CTA — after benefit stack per best practice */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <WaitlistForm buttonText="Start my free team →" />
            <Link
              href="/demo"
              className="text-sm font-semibold text-accent transition hover:underline"
            >
              Book a 20-min demo →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-bg-2 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-display text-[28px] text-ink sm:text-[36px]">
            From zero to shipping in one afternoon.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-ink-2">
            No IT ticket. No onboarding call. No six-week rollout. This is a
            team management app built for teams who need results this sprint —
            not next quarter.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <StepCard
              step="01"
              title="Invite your team"
              desc="Up to 5 seats free — no credit card, no deadline. Your team joins in minutes via a shared link. Connect Slack, Jira, or Linear in one click."
            />
            <StepCard
              step="02"
              title="Alpha reads your sprint"
              desc="Alpha Lead surfaces the first AI-ranked task queue within minutes of setup. No manual triage. Every team member starts the day knowing exactly what to do first."
            />
            <StepCard
              step="03"
              title="Ship without micromanaging"
              desc="Blockers get flagged anonymously, peers get matched, and leaders see one clean dashboard — no extra meetings, no surveillance, no guessing."
            />
          </div>
        </div>
      </section>

      {/* ─── REMOTE TEAMS ───────────────────────────────────────────────────── */}
      {/* H2 keyword: "project management tools for remote teams" — KD 18, Vol 320 */}
      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-accent">
            Remote &amp; async-first teams
          </p>
          <h2 className="mt-3 text-center font-display text-[28px] text-ink sm:text-[36px]">
            Project management tools for remote teams.
            <br />
            <span className="text-ink-2">Built async from day one.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-ink-2">
            Most remote team management tools were built for office teams that
            went remote — not for teams born async. Alpha Lead was designed from
            zero for the distributed, virtual team management reality your people
            already live in.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <RemoteCard
              title="Async by design, not by workaround"
              desc="Every feature — task queue, blocker flag, standup, peer matching — is built for the team where members are online at different times. No bolt-on async mode."
            />
            <RemoteCard
              title="Time zone–aware task prioritization"
              desc="The AI accounts for overlapping hours, declared availability, and cross-timezone dependencies. Nobody wakes up to a sprint blocker they couldn't have seen coming."
            />
            <RemoteCard
              title="No 'always on' pressure"
              desc="The anonymous blocker flag does not trigger a manager ping. It quietly finds the right peer and connects them — on their schedule, in their time zone, without creating urgency theater."
            />
          </div>
        </div>
      </section>

      {/* ─── COMPARISON TABLE ───────────────────────────────────────────────── */}
      {/* H2 keyword: "team management software" — KD 27, Vol 2400 */}
      <section className="border-y border-line bg-bg-2 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-accent">
            Team management software — compared honestly
          </p>
          <h2 className="mt-3 text-center font-display text-[28px] text-ink sm:text-[36px]">
            You don&apos;t need to quit your current stack.
            <br />
            <span className="text-ink-2">
              Alpha AI layers right on top of it.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-ink-2">
            Asana, ClickUp, and Monday.com are excellent for organizing tasks you
            have already agreed on. But none of them answer what your team asks
            every morning:{" "}
            <em>&ldquo;What do I actually start right now?&rdquo;</em> That gap
            is exactly where Alpha Lead AI lives — without replacing a single
            tool in your current stack.
          </p>

          {/* Comparison table */}
          <div className="mt-12 overflow-x-auto rounded-[24px] border border-line">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface">
                  <th className="px-5 py-5 text-left font-display text-base text-ink-2 w-[34%]">
                    What your team needs
                  </th>
                  <th className="px-4 py-5 text-center text-xs font-bold uppercase tracking-wide text-ink-3 w-[16%]">
                    Asana / ClickUp
                    <br />/ Monday
                  </th>
                  <th className="px-4 py-5 text-center text-xs font-bold uppercase tracking-wide text-ink-3 w-[16%]">
                    Slack /
                    <br />
                    Teams Only
                  </th>
                  <th className="px-4 py-5 text-center text-xs font-bold uppercase tracking-wide text-ink-3 w-[16%]">
                    Monitoring
                    <br />
                    Software
                  </th>
                  <th className="px-4 py-5 text-center w-[18%]">
                    <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap">
                      Alpha Lead AI
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-line last:border-0 ${
                      i % 2 === 0 ? "bg-bg" : "bg-surface"
                    }`}
                  >
                    <td className="px-5 py-4 font-medium text-ink">
                      {row.feature}
                    </td>
                    <td className="px-4 py-4 text-center text-ink-3">
                      {row.taskTools}
                    </td>
                    <td className="px-4 py-4 text-center text-ink-3">
                      {row.comms}
                    </td>
                    <td className="px-4 py-4 text-center text-ink-3">
                      {row.monitoring}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-accent">
                      {row.alpha}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── PRICING ────────────────────────────────────────────────────────── */}
      {/* Body keyword: "team management app" — KD 26, Vol 590 */}
      <section id="pricing" className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-accent">
            Team management app pricing
          </p>
          <h2 className="mt-3 text-center font-display text-[28px] text-ink sm:text-[36px]">
            One flat price. No AI credit overages — ever.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-center text-ink-2">
            Every other AI tool charges a base seat fee plus variable token
            consumption. When your team has a busy sprint, your bill spikes.
            Alpha Lead charges one flat rate per team, regardless of how hard
            your AI works.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {/* FREE */}
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              description="For small teams starting out"
              features={[
                "Up to 5 users — no time limit",
                "Anonymous blocker flag (unlimited)",
                "AI task prioritization — 5 tasks/day",
                "Async standup — 1 team",
                "1 co-created sprint doc per month",
                "No credit card required",
              ]}
              cta="Start free today →"
              href="/login"
            />
            {/* TEAM — highlighted, most popular */}
            <PricingCard
              name="Team"
              price="$20"
              period="team / mo"
              description="For teams of 2–10 shipping every sprint"
              features={[
                "2–10 users",
                "Unlimited AI task prioritization",
                "Unlimited anonymous blocker flags",
                "Unlimited async standups",
                "Alpha Space — templates & matrix canvas",
                "AI + team knowledge base",
                "Leader + teammate feedback dashboard",
                "Slack, Linear, Notion, Jira, GitHub",
                "Priority email support",
              ]}
              cta="Start 14-day trial →"
              href="/login"
              secondaryCta="Book a demo instead"
              secondaryHref="/demo"
              highlighted
            />
            {/* ENTERPRISE */}
            <PricingCard
              name="Enterprise"
              price="Custom"
              period="quote"
              description="For teams of 10+ or enterprise compliance needs"
              features={[
                "Unlimited users",
                "Everything in Team",
                "SSO + security review",
                "Custom integrations & API access",
                "Dedicated onboarding & migration",
                "SLA + uptime guarantee",
                "CHRO / VP Engineering dashboard",
              ]}
              cta="Talk to us →"
              href="/demo"
            />
          </div>
          <p className="mt-8 text-center text-xs text-ink-3">
            No credit card on the free plan · Cancel anytime · No AI credit
            overages on any plan · Flat pricing — your bill never spikes during
            a productive sprint
          </p>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────────────── */}
      {/* FAQ JSON-LD schema injected above — targets Google FAQ rich results */}
      <section className="border-y border-line bg-bg-2 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-[28px] text-ink sm:text-[36px]">
            Questions your team will ask before saying yes.
          </h2>
          <div className="mt-12 flex flex-col gap-3">
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-line bg-surface"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 font-display text-[17px] text-ink [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span className="ml-4 flex-shrink-0 text-xl font-light text-ink-3 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="px-6 pb-6 text-[15px] leading-relaxed text-ink-2">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────────────────── */}
      {/* H2 keyword: "effective management strategies" — KD 35, Vol 260 */}
      {/* Repeated CTA placement: after FAQ, near pricing — best practice */}
      <section className="px-6 py-24 text-center lg:px-12">
        <h2 className="font-display text-[32px] leading-tight text-ink sm:text-[44px]">
          Your effective management strategy starts
          <br className="hidden sm:block" />
          the moment your team joins.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-2">
          Choice paralysis, hidden blockers, and context switching are costing
          your team thousands of hours every sprint. Alpha Lead AI is the only
          team management tool designed to solve that at the root — anonymously,
          asynchronously, without adding a single meeting to your calendar.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <WaitlistForm buttonText="Invite your team — free up to 5 seats →" />
          <Link
            href="/demo"
            className="rounded-full border border-line-2 bg-surface px-6 py-3 text-sm font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line-2)] transition hover:bg-surface-2"
          >
            Book a demo →
          </Link>
        </div>
        <p className="mt-4 text-xs text-ink-3">
          No credit card · No onboarding call · Setup in under 10 minutes
        </p>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────────── */}
      {/* Blog links carry internal link equity to keyword-targeted blog articles */}
      <footer className="border-t border-line px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <Alpha size={28} mood="calm" />
                <span className="font-display text-lg text-ink">
                  AlphaLead AI
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-3">
                Built for the teams that ship.
                <br />
                Not for the reports that follow.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
                  Product
                </p>
                <div className="mt-4 flex flex-col gap-2.5">
                  <Link
                    href="#features"
                    className="text-sm text-ink-2 transition hover:text-ink"
                  >
                    Features
                  </Link>
                  <Link
                    href="#pricing"
                    className="text-sm text-ink-2 transition hover:text-ink"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/demo"
                    className="text-sm text-ink-2 transition hover:text-ink"
                  >
                    Book a demo
                  </Link>
                  <Link
                    href="/login"
                    className="text-sm text-ink-2 transition hover:text-ink"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
                  Company
                </p>
                <div className="mt-4 flex flex-col gap-2.5">
                  <Link
                    href="/about"
                    className="text-sm text-ink-2 transition hover:text-ink"
                  >
                    About
                  </Link>
                  <Link
                    href="/blog"
                    className="text-sm text-ink-2 transition hover:text-ink"
                  >
                    Blog
                  </Link>
                  <Link
                    href="/careers"
                    className="text-sm text-ink-2 transition hover:text-ink"
                  >
                    Careers
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
                  Legal
                </p>
                <div className="mt-4 flex flex-col gap-2.5">
                  <Link
                    href="/privacy"
                    className="text-sm text-ink-2 transition hover:text-ink"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className="text-sm text-ink-2 transition hover:text-ink"
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* SEO blog links — anchor text targets keyword-mapped blog articles */}
          <div className="mt-10 rounded-[20px] border border-line bg-surface p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
              From the blog
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href="/blog/how-to-improve-team-productivity"
                className="text-sm text-ink-2 transition hover:text-ink hover:underline"
              >
                → How to improve team productivity without adding another standup
              </Link>
              <Link
                href="/blog/workplace-management-solutions"
                className="text-sm text-ink-2 transition hover:text-ink hover:underline"
              >
                → What are workplace management solutions? A guide for eng leads
              </Link>
              <Link
                href="/blog/ai-task-prioritization"
                className="text-sm text-ink-2 transition hover:text-ink hover:underline"
              >
                → AI task prioritization: how it works vs. manual sprint planning
              </Link>
              <Link
                href="/blog/remote-team-management-tools"
                className="text-sm text-ink-2 transition hover:text-ink hover:underline"
              >
                → Best remote team management tools for async-first startups
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-ink-3">
            © {new Date().getFullYear()} Alpha Lead AI — alphalead.space ·
            Built with AI agents on Google Cloud.
          </div>
        </div>
      </footer>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[24px] border border-line bg-surface p-6 text-center">
      <div className="font-display text-[40px] text-accent">{value}</div>
      <p className="mt-2 text-sm leading-snug text-ink-2">{label}</p>
    </div>
  );
}

function ProblemCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[24px] border border-line bg-surface p-6">
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{desc}</p>
    </div>
  );
}

function FeatureCard({
  tag,
  title,
  desc,
}: {
  tag: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-[24px] border border-line bg-surface p-6 transition hover:bg-surface-2">
      <p className="text-xs font-bold uppercase tracking-wider text-accent">
        {tag}
      </p>
      <h3 className="mt-2 font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{desc}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  desc,
}: {
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-[24px] border border-line bg-surface p-6">
      <div className="font-display text-[40px] leading-none text-accent opacity-25">
        {step}
      </div>
      <h3 className="mt-4 font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{desc}</p>
    </div>
  );
}

function RemoteCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[24px] border border-line bg-surface p-6">
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{desc}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  href,
  secondaryCta,
  secondaryHref,
  highlighted = false,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href?: string;
  secondaryCta?: string;
  secondaryHref?: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-[28px] border p-8 ${
        highlighted ? "border-accent bg-accent-soft" : "border-line bg-surface"
      }`}
    >
      {highlighted && (
        <div className="mb-4 inline-flex self-start rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
          Most popular
        </div>
      )}
      <h3 className="font-display text-2xl text-ink">{name}</h3>
      <p className="mt-1 text-sm text-ink-3">{description}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-display text-[48px] leading-none text-ink">
          {price}
        </span>
        <span className="text-ink-3">/{period}</span>
      </div>
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-3 text-[15px] text-ink-2"
          >
            <span className="mt-0.5 flex-shrink-0 text-sage">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-3">
        {href ? (
          <Link
            href={href}
            className={`block rounded-full px-6 py-3 text-center text-sm font-semibold transition ${
              highlighted
                ? "bg-accent text-white hover:opacity-90"
                : "bg-surface-2 text-ink shadow-[inset_0_0_0_1px_var(--color-line-2)] hover:bg-surface"
            }`}
          >
            {cta}
          </Link>
        ) : (
          <WaitlistForm buttonText={cta} />
        )}
        {secondaryCta && secondaryHref && (
          <Link
            href={secondaryHref}
            className="block text-center text-sm text-ink-2 transition hover:text-accent"
          >
            {secondaryCta}
          </Link>
        )}
      </div>
    </div>
  );
}
