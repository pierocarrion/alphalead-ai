import type { Metadata } from "next";
import Link from "next/link";
import { Alpha } from "@/shared/ui";
import { DemoBooking } from "@/features/marketing/components/DemoBooking";
import { absoluteUrl, siteName } from "@/shared/lib/site";
import { demoTimezone } from "@/server/lib/demoScheduling";

const PAGE_DESCRIPTION =
  "Book a 20-minute live demo of AlphaLead AI. See AI task prioritization, anonymous blocker flags, and async standups in action — on your team's real workflow.";

export const metadata: Metadata = {
  title: "Book a demo — AlphaLead AI",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/demo" },
  openGraph: {
    type: "website",
    url: absoluteUrl("/demo"),
    siteName,
    title: "Book a demo — AlphaLead AI",
    description: PAGE_DESCRIPTION,
  },
};

export default function DemoPage() {
  const timeZone = demoTimezone();

  return (
    <main className="flex min-h-screen flex-col">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-bg/90 px-6 py-4 backdrop-blur lg:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <Alpha size={32} mood="happy" />
          <span className="font-display text-xl text-ink">AlphaLead</span>
        </Link>
        <Link
          href="/login"
          className="rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line-2)] transition hover:bg-surface-2"
        >
          Sign in
        </Link>
      </nav>

      <section className="mx-auto w-full max-w-5xl px-6 py-14 lg:px-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-surface px-4 py-1.5 text-xs font-bold text-ink-2">
            <span className="h-2 w-2 rounded-full bg-sage" />
            20-minute live walkthrough
          </div>
          <h1 className="mt-5 font-display text-[36px] leading-tight text-ink sm:text-[48px]">
            Book a demo with the AlphaLead team.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-2">
            Pick a time that works for you. We&apos;ll tailor the walkthrough to
            your stack and show you exactly how AlphaLead removes choice
            paralysis for your team.
          </p>
        </div>

        <div className="mt-12">
          <DemoBooking timeZone={timeZone} />
        </div>

        <p className="mt-10 text-center text-xs text-ink-3">
          All times shown in {timeZone}. Need another time zone or have a
          question first? Email{" "}
          <a
            href="mailto:hello@alphalead.space"
            className="text-accent underline"
          >
            hello@alphalead.space
          </a>
          .
        </p>
      </section>
    </main>
  );
}
