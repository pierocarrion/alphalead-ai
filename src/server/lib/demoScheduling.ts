/**
 * Demo-slot availability for the public "Book a demo" calendar.
 *
 * Availability is driven by the working hours the sales team declares via
 * env vars (DEMO_WORK_HOUR_START / END, DEMO_WORK_DAYS, DEMO_TZ). Slots
 * already booked are removed so we never double-book before Zoho syncs.
 *
 * All display is computed on the server in the configured IANA time zone
 * (DEMO_TZ, defaults to America/Lima) and shipped as ready-to-render
 * strings, so the visitor's own time zone can never garble the schedule.
 */

export interface DemoSlot {
  /** ISO 8601 UTC instant, e.g. 2026-06-29T14:00:00.000Z */
  start: string;
  /** ISO 8601 UTC instant */
  end: string;
  /** Pre-formatted weekday, e.g. "Mon" */
  weekday: string;
  /** Pre-formatted date, e.g. "Jun 29" */
  dateLabel: string;
  /** Pre-formatted time in the seller's TZ, e.g. "09:00" */
  timeLabel: string;
}

export interface DemoAvailabilityOptions {
  startHour?: number;
  endHour?: number;
  durationMinutes?: number;
  lookaheadDays?: number;
  slotStepMinutes?: number;
  minLeadMinutes?: number;
  timeZone?: string;
  locale?: string;
}

export interface BookedSlot {
  start: string;
}

function resolveOptions(opts: DemoAvailabilityOptions | undefined) {
  return {
    startHour: opts?.startHour ?? Number(process.env.DEMO_WORK_HOUR_START ?? 9),
    endHour: opts?.endHour ?? Number(process.env.DEMO_WORK_HOUR_END ?? 18),
    durationMinutes: opts?.durationMinutes ?? Number(process.env.DEMO_DURATION_MINUTES ?? 30),
    lookaheadDays: opts?.lookaheadDays ?? Number(process.env.DEMO_LOOKAHEAD_DAYS ?? 14),
    slotStepMinutes: opts?.slotStepMinutes ?? Number(process.env.DEMO_SLOT_STEP_MINUTES ?? 30),
    minLeadMinutes: opts?.minLeadMinutes ?? Number(process.env.DEMO_MIN_LEAD_MINUTES ?? 120),
    timeZone: opts?.timeZone ?? process.env.DEMO_TZ ?? "America/Lima",
    locale: opts?.locale ?? process.env.DEMO_LOCALE ?? "en-US",
  };
}

/**
 * Working weekdays as a Set of getDay() values (0=Sun … 6=Sat).
 * Defaults to Mon–Fri. Override with DEMO_WORK_DAYS="1,2,3,4,5".
 */
function getWorkingWeekdays(): Set<number> {
  const raw = process.env.DEMO_WORK_DAYS;
  if (!raw) return new Set([1, 2, 3, 4, 5]);
  const set = new Set<number>();
  for (const part of raw.split(",")) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && n >= 0 && n <= 6) set.add(n);
  }
  return set.size ? set : new Set([1, 2, 3, 4, 5]);
}

const HOUR_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function formatters(opts: ReturnType<typeof resolveOptions>) {
  const key = `${opts.locale}|${opts.timeZone}`;
  let cached = HOUR_FORMATTER_CACHE.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat(opts.locale, {
      timeZone: opts.timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    HOUR_FORMATTER_CACHE.set(key, cached);
  }
  return cached;
}

function labelParts(
  instant: number,
  opts: ReturnType<typeof resolveOptions>
): Pick<DemoSlot, "weekday" | "dateLabel" | "timeLabel"> {
  // Intl parts include weekday, month/day and time; we recombine the
  // weekday + date + time pieces in a stable order.
  const parts = formatters(opts).formatToParts(new Date(instant));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = get("weekday");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  return {
    weekday,
    dateLabel: `${month} ${day}`.trim(),
    timeLabel: `${hour}:${minute}`,
  };
}

/**
 * Computes all bookable demo slots over the next N days.
 *
 * Strategy: iterate candidate UTC instants stepping from "midnight today
 * in DEMO_TZ"; for each, derive the wall-clock hour in DEMO_TZ and keep it
 * only if it falls inside the working window. This avoids any manual
 * offset math and is DST-correct.
 */
export function computeDemoSlots(
  booked: BookedSlot[],
  options?: DemoAvailabilityOptions
): DemoSlot[] {
  const opts = resolveOptions(options);
  const workingDays = getWorkingWeekdays();
  const durationMs = opts.durationMinutes * 60_000;
  const stepMs = opts.slotStepMinutes * 60_000;
  const earliest = Date.now() + opts.minLeadMinutes * 60_000;

  const bookedSet = new Set(
    booked
      .map((b) => {
        const t = Date.parse(b.start);
        return Number.isFinite(t) ? t : NaN;
      })
      .filter((t) => Number.isFinite(t))
  );

  // Anchor: midnight today in the configured TZ.
  const anchor = startOfTodayInTz(opts.timeZone);

  const slots: DemoSlot[] = [];

  for (let dayOffset = 0; dayOffset <= opts.lookaheadDays; dayOffset++) {
    const dayStartUtc = anchor + dayOffset * 24 * 60 * 60_000;
    if (!workingDays.has(weekdayInTz(dayStartUtc, opts.timeZone))) continue;

    // Sweep every slot-step across the day; keep only those whose
    // wall-clock start hour is inside [startHour, endHour).
    for (let t = dayStartUtc; t < dayStartUtc + 24 * 60 * 60_000; t += stepMs) {
      const hour = hourInTz(t, opts.timeZone);
      const minute = minuteInTz(t, opts.timeZone);
      const wallStartMinutes = hour * 60 + minute;
      const windowEndMinutes = opts.endHour * 60;
      const wallEndMinutes =
        wallStartMinutes + opts.durationMinutes;
      if (
        wallStartMinutes < opts.startHour * 60 ||
        wallEndMinutes > windowEndMinutes
      ) {
        continue;
      }
      if (t < earliest) continue;
      if (bookedSet.has(t)) continue;

      slots.push({
        start: new Date(t).toISOString(),
        end: new Date(t + durationMs).toISOString(),
        ...labelParts(t, opts),
      });
    }
  }

  return slots.slice(0, 96);
}

function startOfTodayInTz(timeZone: string): number {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  // Midnight in TZ as a UTC instant: build UTC of y-m-d, then subtract offset.
  const utcMidnight = Date.UTC(get("year"), get("month") - 1, get("day"));
  const offsetMs = tzOffsetMs(timeZone, new Date(utcMidnight));
  return utcMidnight - offsetMs;
}

function tzOffsetMs(timeZone: string, date: Date): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = fmt.formatToParts(date);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour") === 24 ? 0 : get("hour"),
      get("minute"),
      get("second")
    );
    return asUtc - date.getTime();
  } catch {
    return -date.getTimezoneOffset() * 60_000;
  }
}

function weekdayInTz(instant: number, timeZone: string): number {
  // Build the wall-clock Date in TZ and read getDay() on it.
  const wall = wallClockInTz(instant, timeZone);
  return wall.getDay();
}

function wallClockInTz(instant: number, timeZone: string): Date {
  const offsetMs = tzOffsetMs(timeZone, new Date(instant));
  return new Date(instant + offsetMs);
}

function hourInTz(instant: number, timeZone: string): number {
  return wallClockInTz(instant, timeZone).getUTCHours();
}

function minuteInTz(instant: number, timeZone: string): number {
  return wallClockInTz(instant, timeZone).getUTCMinutes();
}

export const demoTimezone = () => process.env.DEMO_TZ ?? "America/Lima";
