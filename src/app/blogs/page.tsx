import type { Metadata } from "next";
import Link from "next/link";
import { Alpha } from "@/shared/ui";
import { absoluteUrl, siteName } from "@/shared/lib/site";
import { getAllPosts } from "@/features/blog/data/posts";

export const metadata: Metadata = {
  title: "Blog — AlphaLead AI",
  description:
    "Field notes on team focus, anti-procrastination, and leading without shame. Practical, evidence-backed writing from the AlphaLead team.",
  alternates: { canonical: "/blogs" },
  openGraph: {
    type: "website",
    url: absoluteUrl("/blogs"),
    siteName,
    title: "Blog — AlphaLead AI",
    description:
      "Field notes on team focus, anti-procrastination, and leading without shame.",
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const toneClasses: Record<string, string> = {
  accent: "border-accent bg-accent-soft text-accent",
  sage: "border-sage bg-surface text-sage",
  ink: "border-line-2 bg-bg-2 text-ink",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;

  return (
    <main className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <Alpha size={32} mood="happy" />
          <span className="font-display text-xl text-ink">AlphaLead</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/blogs"
            className="hidden text-sm font-semibold text-ink sm:block"
          >
            Blogs
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line-2)] transition hover:bg-surface-2"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="px-6 pt-10 pb-12 text-center lg:px-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-surface px-4 py-1.5 text-xs font-bold text-ink-2">
          <span className="h-2 w-2 rounded-full bg-sage" />
          Field notes
        </div>
        <h1 className="mt-6 max-w-3xl font-display text-[42px] leading-[1.05] text-ink sm:text-[56px] lg:text-[64px]">
          The AlphaLead blog
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
          Practical, evidence-backed writing on team focus, anti-procrastination,
          and leading without shame.
        </p>
      </section>

      {/* Featured */}
      {featured ? (
        <section className="px-6 pb-14 lg:px-12">
          <Link
            href={`/blogs/${featured.slug}`}
            className="group mx-auto block max-w-5xl rounded-[32px] border border-line-2 bg-surface p-6 transition hover:bg-surface-2 sm:p-10"
          >
            <div className="grid gap-8 sm:grid-cols-2 sm:items-center">
              <div
                className={`flex aspect-[4/3] items-center justify-center rounded-3xl border ${toneClasses[featured.cover.tone]}`}
              >
                <span className="font-display text-2xl">
                  {featured.cover.label}
                </span>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-accent">
                  <span>{featured.category}</span>
                  <span className="text-ink-3">·</span>
                  <span className="text-ink-3">{featured.readingTime}</span>
                </div>
                <h2 className="mt-3 font-display text-[26px] leading-tight text-ink sm:text-[32px]">
                  {featured.title}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  {featured.excerpt}
                </p>
                <p className="mt-5 text-sm text-ink-3">
                  {featured.author.name} · {formatDate(featured.publishedAt)}
                </p>
              </div>
            </div>
          </Link>
        </section>
      ) : null}

      {/* Grid */}
      <section className="px-6 pb-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blogs/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-[24px] border border-line bg-surface transition hover:bg-surface-2"
              >
                <div
                  className={`flex aspect-[16/10] items-center justify-center border-b ${toneClasses[post.cover.tone]}`}
                >
                  <span className="font-display text-lg">{post.cover.label}</span>
                </div>
                <div className="flex flex-1 flex-col p-6 text-left">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-accent">
                    {post.category}
                  </div>
                  <h3 className="mt-2 font-display text-xl leading-snug text-ink">
                    {post.title}
                  </h3>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-2">
                    {post.excerpt}
                  </p>
                  <p className="mt-4 text-xs text-ink-3">
                    {formatDate(post.publishedAt)} · {post.readingTime}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line px-6 py-8 text-center text-sm text-ink-3 lg:px-12">
        © {new Date().getFullYear()} AlphaLead AI. Built with AI agents on Google Cloud.
      </footer>
    </main>
  );
}
