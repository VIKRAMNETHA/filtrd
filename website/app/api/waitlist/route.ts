import { Redis } from "@upstash/redis";

// Stores pilot requests in Upstash Redis. Vercel's Upstash integration sets the KV_REST_API_* variables;
// a direct Upstash setup uses UPSTASH_REDIS_REST_*.
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const SIZES = new Set(["1-10", "11-50", "51-200", "201-1000", "1000+"]);

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export async function POST(request: Request) {
  if (!redis) return json({ error: "Sign-ups aren't switched on yet. Please try again soon." }, 503);
  if (!request.headers.get("content-type")?.includes("application/json")) return json({ error: "Unsupported request." }, 415);
  if (Number(request.headers.get("content-length") ?? 0) > 10_000) return json({ error: "That's too much text." }, 413);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Unsupported request." }, 400);
  }

  // Bots fill the hidden field; they get a normal response and nothing is stored.
  if (text(body.website, 200)) return json({ ok: true });

  const entry = {
    name: text(body.name, 100),
    email: text(body.email, 200).toLowerCase(),
    company: text(body.company, 120),
    size: SIZES.has(text(body.size, 20)) ? text(body.size, 20) : "unknown",
    message: text(body.message, 1000),
    createdAt: new Date().toISOString(),
  };
  if (entry.name.length < 2) return json({ error: "Please enter your name." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) return json({ error: "Please enter a valid work email." }, 400);
  if (entry.company.length < 2) return json({ error: "Please enter your company." }, 400);

  // One entry per email. Repeat sign-ups succeed quietly, so the form can't be used to check who signed up.
  try {
    await redis.set(`signup:${entry.email}`, entry, { nx: true });
  } catch (error) {
    console.error("Waitlist write failed:", error);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
  return json({ ok: true });
}
