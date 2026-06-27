/**
 * Centralized SEO / site configuration.
 *
 * Single source of truth for the canonical site URL so that `metadataBase`,
 * `sitemap.ts`, `robots.ts` and structured data never drift apart.
 *
 * Precedence:
 *   1. SITE_URL  (dedicated prod URL, e.g. https://alphalead.space)
 *   2. NEXTAUTH_URL  (kept as fallback for backward compatibility)
 *   3. https://alphalead.space  (safe prod default — never localhost in prod)
 */

const FALLBACK_PROD_URL = "https://alphalead.space";

function resolveSiteUrl(): string {
  const fromEnv =
    process.env.SITE_URL ??
    process.env.NEXTAUTH_URL ??
    FALLBACK_PROD_URL;
  return fromEnv.replace(/\/$/, "");
}

export const siteUrl = resolveSiteUrl();

export const siteName = "AlphaLead AI";

export const siteDescription =
  "AlphaLead AI is a team management software that gives every team member a clear first step, surfaces anonymous blockers, and eliminates standups — without surveillance. The only team management app built async from day one to eliminate choice paralysis.";

export const siteKeywords = [
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
];

export const siteLocale = "en_US";

/** Absolute URL helper. */
export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalized}`;
}
