const hits = new Map<string, { count: number; resetAt: number }>();

/** Per-process limiter. Swap for a shared store when running more than one instance. */
export function allowRequest(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    if (hits.size > 10_000) hits.clear();
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
