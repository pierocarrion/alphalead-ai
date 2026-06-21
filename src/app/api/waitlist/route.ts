import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  role: z.string().min(1),
  teamSize: z.string().min(1),
});

const WAITLIST_FILE = path.join(process.cwd(), "data", "waitlist.json");

async function readWaitlist(): Promise<Array<Record<string, unknown>>> {
  try {
    const raw = await fs.readFile(WAITLIST_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, role, teamSize } = parsed.data;

  await fs.mkdir(path.dirname(WAITLIST_FILE), { recursive: true });
  const list = await readWaitlist();

  if (list.some((entry) => entry.email === email)) {
    return NextResponse.json({ error: "Email already on the list" }, { status: 409 });
  }

  list.push({
    email,
    role,
    teamSize,
    joinedAt: new Date().toISOString(),
  });

  await fs.writeFile(WAITLIST_FILE, JSON.stringify(list, null, 2));

  return NextResponse.json({ success: true });
}

export async function GET() {
  const list = await readWaitlist();
  return NextResponse.json({ count: list.length, list });
}
