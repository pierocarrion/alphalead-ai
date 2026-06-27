import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alpha } from "@/shared/ui";
import { absoluteUrl, siteName } from "@/shared/lib/site";
import {
  getAllPosts,
  getPostBySlug,
  type BlogPost,
} from "@/features/blog/data/posts";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} — AlphaLead AI`,
    description: post.excerpt,
    alternates: { canonical: `/blogs/${post.slug}` },
    openGraph: {
      type: "article",
      url: absoluteUrl(`/blogs/${post.slug}`),
      siteName,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

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
            className="hidden text-sm font-semibold text-ink-2 hover:text-ink sm:block"
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

      {/* Article */}
      <article className="flex-1 px-6 pb-16 pt-8 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/blogs"
            className="text-sm font-semibold text-ink-3 transition hover:text-ink"
          >
            ← Back to blog
          </Link>

          <div className="mt-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-accent">
            <span>{post.category}</span>
            <span className="text-ink-3">·</span>
            <span className="text-ink-3">{post.readingTime}</span>
          </div>

          <h1 className="mt-4 font-display text-[34px] leading-[1.1] text-ink sm:text-[44px]">
            {post.title}
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-ink-2">
            {post.excerpt}
          </p>

          <div className="mt-6 flex items-center gap-3 border-y border-line py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
              {post.author.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{post.author.name}</p>
              <p className="text-xs text-ink-3">
                {post.author.role} · {formatDate(post.publishedAt)}
              </p>
            </div>
          </div>

          {/* Cover */}
          <div
            className={`mt-8 flex aspect-[16/7] items-center justify-center rounded-[24px] border ${toneClasses[post.cover.tone]}`}
          >
            <span className="font-display text-3xl">{post.cover.label}</span>
          </div>

          {/* Body */}
          <div className="mt-10 space-y-6">
            {post.content.map((block, i) => {
              if (block.type === "h2") {
                return (
                  <h2
                    key={i}
                    className="pt-4 font-display text-2xl leading-snug text-ink"
                  >
                    {block.value}
                  </h2>
                );
              }
              if (block.type === "h3") {
                return (
                  <h3
                    key={i}
                    className="pt-2 font-display text-xl leading-snug text-ink"
                  >
                    {block.value}
                  </h3>
                );
              }
              if (block.type === "quote") {
                return (
                  <blockquote
                    key={i}
                    className="rounded-2xl border border-accent bg-accent-soft p-5 text-[17px] font-medium leading-relaxed text-accent"
                  >
                    {block.value}
                  </blockquote>
                );
              }
              if (block.type === "list") {
                return (
                  <ul key={i} className="space-y-3">
                    {block.value.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-3 text-[17px] leading-relaxed text-ink-2"
                      >
                        <span className="mt-1 text-sage">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p
                  key={i}
                  className="text-[17px] leading-relaxed text-ink-2"
                >
                  {block.value}
                </p>
              );
            })}
          </div>

          {/* Sources */}
          {post.sources && post.sources.length > 0 ? (
            <div className="mt-12 rounded-[24px] border border-line bg-bg-2 p-6">
              <h2 className="font-display text-lg text-ink">Sources</h2>
              <ol className="mt-4 space-y-2">
                {post.sources.map((source, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm leading-relaxed text-ink-2"
                  >
                    <span className="font-semibold text-ink-3">{i + 1}.</span>
                    <span>{source}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {/* Author footer */}
          <div className="mt-12 rounded-[24px] border border-line bg-surface p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                {post.author.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <p className="font-display text-lg text-ink">{post.author.name}</p>
                <p className="text-sm text-ink-2">{post.author.role}</p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 ? (
        <section className="border-t border-line bg-bg-2 px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl text-ink sm:text-3xl">
              Keep reading
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {related.map((p: BlogPost) => (
                <Link
                  key={p.slug}
                  href={`/blogs/${p.slug}`}
                  className="group flex flex-col rounded-[24px] border border-line bg-surface p-6 transition hover:bg-surface-2"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                    {p.category}
                  </div>
                  <h3 className="mt-2 font-display text-lg leading-snug text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-2">
                    {p.excerpt}
                  </p>
                  <p className="mt-4 text-xs text-ink-3">
                    {formatDate(p.publishedAt)} · {p.readingTime}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Footer */}
      <footer className="border-t border-line px-6 py-8 text-center text-sm text-ink-3 lg:px-12">
        © {new Date().getFullYear()} AlphaLead AI. Built with AI agents on Google Cloud.
      </footer>
    </main>
  );
}
