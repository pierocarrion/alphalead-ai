import { NextResponse } from "next/server";
import { jsonError } from "@/server/lib/apiErrors";
import { computeDemoSlots, demoTimezone } from "@/server/lib/demoScheduling";
import { listDemoBookings } from "@/server/lib/demoBookings";

/**
 * GET /api/demo/slots
 *
 * Returns all bookable demo slots for the next N days, computed from the
 * working hours the sales team declares via env vars and minus any slots
 * already booked. Slots are pre-formatted in the seller's time zone so the
 * client never has to do TZ math.
 */
export async function GET() {
  try {
    const booked = await listDemoBookings();
    const slots = computeDemoSlots(booked.map((b) => ({ start: b.start })));
    return NextResponse.json({
      timeZone: demoTimezone(),
      slots,
    });
  } catch (error) {
    return jsonError(error);
  }
}
