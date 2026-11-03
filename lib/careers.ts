import { cache } from "react";
import { headers } from "next/headers";
import { sql } from "./db";
import type { Org } from "./types";

export const getPublicOrg = cache(async (slug: string) => {
  const [org] = await sql<Org[]>`
    select * from organizations where slug = ${slug.toLowerCase()}`;
  return org ?? null;
});

/** Path prefix for links: empty on the tenant's subdomain, /careers/<slug> on the main domain. */
export async function careerBase(slug: string) {
  return (await headers()).get("x-career-subdomain") ? "" : `/careers/${slug}`;
}
