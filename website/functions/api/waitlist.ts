// Cloudflare Pages Function: POST /api/waitlist stores a pilot request in the WAITLIST KV namespace.

type KV = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};
type Context = { request: Request; env: { WAITLIST?: KV } };

const SIZES = new Set(["1-10", "11-50", "51-200", "201-1000", "1000+"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export async function onRequestPost({ request, env }: Context) {
  if (!env.WAITLIST) return json({ error: "Sign-ups aren't switched on yet. Please try again soon." }, 503);
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
  const key = `signup:${entry.email}`;
  if (!(await env.WAITLIST.get(key))) await env.WAITLIST.put(key, JSON.stringify(entry));
  return json({ ok: true });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, 405);
}
