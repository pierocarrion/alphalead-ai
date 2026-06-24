import type { GrowthGranularity } from "../entities/TeamGrowth";

const MS_PER_DAY = 86400000;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isoDate(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

export function bucketsFor(
  granularity: GrowthGranularity,
  since: Date,
  until: Date,
  maxBuckets = 16
): { label: string; start: Date; end: Date }[] {
  const buckets: { label: string; start: Date; end: Date }[] = [];
  let cursor = startOfDay(since);
  const end = startOfDay(until);

  let guard = 0;
  while (cursor <= end && guard < maxBuckets + 4) {
    guard++;
    let next: Date;
    let label: string;
    if (granularity === "week") {
      next = addDays(cursor, 7);
      label = isoDate(cursor);
    } else if (granularity === "month") {
      next = addMonths(cursor, 1);
      label = monthLabel(cursor);
    } else if (granularity === "quarter") {
      next = addMonths(cursor, 3);
      label = `${quarterLabel(cursor)}`;
    } else {
      next = addMonths(cursor, 12);
      label = `${cursor.getFullYear()}`;
    }
    const sliceEnd = next > end ? end : next;
    buckets.push({ label, start: cursor, end: sliceEnd });
    cursor = next;
  }

  return buckets.slice(-maxBuckets);
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months, 1);
  const targetMonth = d.getMonth();
  d.setDate(Math.min(day, daysInMonth(d.getFullYear(), targetMonth)));
  return d;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function monthLabel(date: Date): string {
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${names[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
}

export function quarterLabel(date: Date): string {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `Q${q} ${String(date.getFullYear()).slice(2)}`;
}

export function defaultWindow(granularity: GrowthGranularity): {
  since: Date;
  until: Date;
} {
  const until = new Date();
  let since: Date;
  switch (granularity) {
    case "week":
      since = addDays(until, -7 * 12);
      break;
    case "month":
      since = addMonths(until, -12);
      break;
    case "quarter":
      since = addMonths(until, -12 * 3);
      break;
    case "year":
      since = addMonths(until, -12 * 5);
      break;
  }
  return { since, until };
}
