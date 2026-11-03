export function appUrl(path = "") {
  return `${process.env.APP_URL ?? "http://localhost:3000"}${path}`;
}

/** Each tenant's career site lives on its own subdomain. */
export function careerSiteUrl(slug: string, path = "") {
  const root = process.env.ROOT_DOMAIN ?? "localhost:3000";
  const scheme = (process.env.APP_URL ?? "").startsWith("https") ? "https" : "http";
  return `${scheme}://${slug}.${root}${path}`;
}

export const RESERVED_SLUGS = new Set([
  "www", "app", "api", "admin", "careers", "jobs", "login", "signup", "mail", "static", "assets", "help", "support", "status",
]);
