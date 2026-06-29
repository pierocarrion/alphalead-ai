/**
 * Zoho integration — lightweight client for the public demo flow.
 *
 * Two responsibilities:
 *   1. createDemoLead()       → upserts a Lead in Zoho CRM.
 *   2. createCalendarEvent()  → creates an event in Zoho Calendar so the
 *      sales team sees the booked demo alongside their other meetings.
 *
 * Auth: self-contained OAuth2 using a stored refresh token (grant type
 * "refresh_token"). The access token is cached in-memory for its lifetime.
 *
 * Configuration is fully optional: if any env var is missing the functions
 * resolve to `{ ok: false, reason: "not-configured" }` so the demo flow
 * still works locally without Zoho. Never throw on a missing/failed Zoho
 * call — the user's booking must always succeed on our side first.
 */

import { createLogger } from "@/shared/lib/logger";

const log = createLogger("zoho");

const TOKEN_URL = "https://accounts.zoho.com/oauth/v2/token";
const CRM_API_BASE =
  process.env.ZOHO_CRM_API_BASE ?? "https://www.zohoapis.com/crm/v6";
const CALENDAR_API_BASE =
  process.env.ZOHO_CALENDAR_API_BASE ??
  "https://calendar.zoho.com/api/v1";

export interface ZohoLead {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  description?: string;
}

export interface ZohoEvent {
  /** ISO 8601 start */
  start: string;
  /** ISO 8601 end */
  end: string;
  title: string;
  description?: string;
  /** Attendee emails to invite */
  attendees?: string[];
}

export type ZohoResult =
  | { ok: true; id?: string }
  | { ok: false; reason: "not-configured" | "error"; message?: string };

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

export function isZohoConfigured(): boolean {
  return Boolean(
    process.env.ZOHO_CLIENT_ID &&
      process.env.ZOHO_CLIENT_SECRET &&
      process.env.ZOHO_REFRESH_TOKEN
  );
}

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      // Next.js fetch cache opt-out.
      cache: "no-store",
    });
    if (!res.ok) {
      log.error("oauth token request failed", { status: res.status });
      return null;
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
      log.error("oauth response missing access_token", { data });
      return null;
    }
    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    return cachedToken.value;
  } catch (err) {
    log.error("oauth token threw", { error: err });
    return null;
  }
}

function splitName(full?: string): { first?: string; last?: string } {
  if (!full) return {};
  const trimmed = full.trim();
  if (!trimmed) return {};
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

/**
 * Upserts a Lead in Zoho CRM. Idempotent on email via the upsert operation.
 */
export async function createDemoLead(input: ZohoLead): Promise<ZohoResult> {
  if (!isZohoConfigured()) {
    return { ok: false, reason: "not-configured" };
  }
  const token = await getAccessToken();
  if (!token) return { ok: false, reason: "error", message: "no-token" };

  const { first: First_Name, last: Last_Name } = splitName(
    input.lastName ? `${input.firstName ?? ""} ${input.lastName}` : input.firstName
  );

  const payload = {
    data: [
      {
        ...(First_Name ? { First_Name } : {}),
        ...(Last_Name ? { Last_Name } : {}),
        Email: input.email,
        ...(input.company ? { Company: input.company } : {}),
        ...(input.phone ? { Phone: input.phone } : {}),
        ...(input.description ? { Description: input.description } : {}),
        Lead_Source: "Website Demo Booking",
      },
    ],
  };

  try {
    const res = await fetch(`${CRM_API_BASE}/Leads/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      log.error("crm upsert failed", { status: res.status, body: text });
      return { ok: false, reason: "error", message: `crm-${res.status}` };
    }
    const data = (await res.json()) as {
      data?: Array<{ details?: { id?: string }; status?: string; code?: string }>;
    };
    const entry = data.data?.[0];
    return { ok: true, id: entry?.details?.id };
  } catch (err) {
    log.error("crm upsert threw", { error: err });
    return { ok: false, reason: "error", message: "crm-threw" };
  }
}

/**
 * Creates an event in Zoho Calendar so the booked demo shows up in the
 * sales team's calendar. Best-effort: failures never block the booking.
 */
export async function createCalendarEvent(input: ZohoEvent): Promise<ZohoResult> {
  if (!isZohoConfigured()) {
    return { ok: false, reason: "not-configured" };
  }
  const token = await getAccessToken();
  if (!token) return { ok: false, reason: "error", message: "no-token" };

  const payload = {
    title: input.title,
    ...(input.description ? { description: input.description } : {}),
    dateandtime: {
      start: input.start,
      end: input.end,
    },
    ...(input.attendees?.length
      ? { attendees: input.attendees.map((email) => ({ email })) }
      : {}),
  };

  try {
    const res = await fetch(`${CALENDAR_API_BASE}/calendars/events`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      log.error("calendar create failed", { status: res.status, body: text });
      return { ok: false, reason: "error", message: `cal-${res.status}` };
    }
    const data = (await res.json()) as { events?: Array<{ id?: { uid?: string } }>; id?: { uid?: string } };
    const id = data.events?.[0]?.id?.uid ?? data.id?.uid;
    return { ok: true, id };
  } catch (err) {
    log.error("calendar create threw", { error: err });
    return { ok: false, reason: "error", message: "cal-threw" };
  }
}
