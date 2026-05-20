import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "subscribers.json");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Subscriber = { email: string; createdAt: string };

async function readSubscribers(): Promise<Subscriber[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeSubscribers(list: Subscriber[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2));
}

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email" },
      { status: 400 }
    );
  }

  // Local-file storage. For production deploys (Vercel etc.) the filesystem
  // is read-only — swap this for Supabase / Resend / ConvertKit / Buttondown.
  const list = await readSubscribers();
  if (list.some((s) => s.email === email)) {
    return NextResponse.json({ ok: true, dedupe: true });
  }
  list.push({ email, createdAt: new Date().toISOString() });
  await writeSubscribers(list);

  // Visibility for ops while building in public.
  console.log(`[subscribe] ${email}`);

  return NextResponse.json({ ok: true });
}
