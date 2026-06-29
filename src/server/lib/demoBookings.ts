import { promises as fs } from "fs";
import path from "path";

export interface DemoBooking {
  id: string;
  email: string;
  name?: string;
  company?: string;
  notes?: string;
  /** ISO 8601 UTC */
  start: string;
  /** ISO 8601 UTC */
  end: string;
  createdAt: string;
  /** Mirror of the Zoho outcome, for debugging. */
  zoho?: {
    lead?: unknown;
    event?: unknown;
  };
}

const FILE = path.join(process.cwd(), "data", "demo-bookings.json");

async function readAll(): Promise<DemoBooking[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as DemoBooking[];
  } catch {
    return [];
  }
}

async function writeAll(list: DemoBooking[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(list, null, 2));
}

export async function listDemoBookings(): Promise<DemoBooking[]> {
  return readAll();
}

export async function findBookingByStart(startIso: string): Promise<DemoBooking | undefined> {
  const list = await readAll();
  return list.find((b) => b.start === startIso);
}

export async function saveDemoBooking(
  booking: DemoBooking
): Promise<DemoBooking> {
  const list = await readAll();
  list.push(booking);
  await writeAll(list);
  return booking;
}
