import { NextResponse } from "next/server";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import {
  jsonError,
  parseRequestBody,
  toFriendlyMessage,
} from "@/server/lib/apiErrors";
import { UserFacingError } from "@/server/lib/errors";
import { computeDemoSlots } from "@/server/lib/demoScheduling";
import {
  findBookingByStart,
  listDemoBookings,
  saveDemoBooking,
  type DemoBooking,
} from "@/server/lib/demoBookings";
import {
  createCalendarEvent,
  createDemoLead,
  isZohoConfigured,
  type ZohoResult,
} from "@/server/services/zoho";

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1, "Please tell us your name.").max(120),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  notes: z.string().trim().max(600).optional().or(z.literal("")),
  start: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await parseRequestBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: toFriendlyMessage(parsed.error) },
        { status: 400 }
      );
    }
    const { email, name, company, notes, start } = parsed.data;

    // Validate the slot is still available.
    const booked = await listDemoBookings();
    if (booked.some((b) => b.start === start)) {
      throw new UserFacingError(
        "That slot was just taken. Please pick another time.",
        409
      );
    }

    const valid = computeDemoSlots(
      booked.map((b) => ({ start: b.start }))
    ).some((s) => s.start === start);
    if (!valid) {
      throw new UserFacingError(
        "That time is outside our available demo hours. Please pick another slot.",
        400
      );
    }

    const slot = computeDemoSlots(
      booked.map((b) => ({ start: b.start }))
    ).find((s) => s.start === start)!;
    const endIso = slot.end;

    // Persist locally FIRST so a Zoho outage never loses the booking.
    const existing = await findBookingByStart(start);
    if (existing) {
      throw new UserFacingError(
        "That slot was just taken. Please pick another time.",
        409
      );
    }

    const booking: DemoBooking = {
      id: createId(),
      email,
      name,
      company: company || undefined,
      notes: notes || undefined,
      start,
      end: endIso,
      createdAt: new Date().toISOString(),
    };

    // Push to Zoho (best-effort). Failures are recorded but never block.
    const zoho: DemoBooking["zoho"] = {};
    if (isZohoConfigured()) {
      const [lead, event] = await Promise.all([
        createDemoLead({
          email,
          firstName: name,
          company: company || undefined,
          description: notes
            ? `Demo request: ${notes}`
            : "Demo request via website.",
        }),
        createCalendarEvent({
          title: `Demo · ${name}${company ? ` (${company})` : ""}`,
          start,
          end: endIso,
          description: notes
            ? `${notes}\n\nEmail: ${email}${company ? `\nCompany: ${company}` : ""}`
            : `AlphaLead AI demo.\nEmail: ${email}${company ? `\nCompany: ${company}` : ""}`,
          attendees: [email],
        }),
      ]);
      zoho.lead = lead;
      zoho.event = event;
    }
    booking.zoho = zoho;

    await saveDemoBooking(booking);

    return NextResponse.json({
      success: true,
      id: booking.id,
      start,
      end: endIso,
      zohoSynced: isOkResult(zoho.lead),
    });
  } catch (error) {
    return jsonError(error);
  }
}

function isOkResult(value: unknown): value is Extract<ZohoResult, { ok: true }> {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { ok?: unknown }).ok === true
  );
}
