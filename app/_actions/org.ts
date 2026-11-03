"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getUser, requireOrg, startSession } from "@/lib/auth";
import { sql, withTenant, withUser } from "@/lib/db";
import type { FormState } from "@/lib/types";
import { RESERVED_SLUGS } from "@/lib/urls";

const Round = z.object({
  name: z.string().trim().min(1, "Every round needs a name.").max(80),
  kind: z.enum(["screening", "assessment", "interview", "final"]),
});

const optionalUrl = z.union([z.literal(""), z.url("Please enter a full website address, starting with https://.").max(300)]);

const Slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/, "Your career site address can use lowercase letters, numbers and hyphens.")
  .refine((s) => !RESERVED_SLUGS.has(s), "That career site address is reserved. Please choose another.");

const OrgFields = z.object({
  name: z.string().trim().min(2, "Please enter your organization's name.").max(120),
  website: optionalUrl,
  industry: z.string().trim().max(80),
  companySize: z.string().trim().max(40),
  headquarters: z.string().trim().max(120),
  tagline: z.string().trim().max(160),
  about: z.string().trim().max(3000),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Please choose a valid brand colour."),
  hrEmail: z.email("Please enter a valid HR email.").max(200),
  defaultThreshold: z.coerce.number().int().min(0).max(100),
  defaultActiveDays: z.coerce.number().int().min(1).max(365),
  departments: z.array(z.string().trim().min(1).max(60)).max(50),
  defaultRounds: z.array(Round).max(10),
});

function parsePayload(form: FormData) {
  try {
    return JSON.parse(String(form.get("payload") ?? "{}"));
  } catch {
    return {};
  }
}

export async function completeOnboardingAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) redirect("/login");

  const parsed = OrgFields.extend({ slug: Slug }).safeParse(parsePayload(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const existing = await withUser(user.id, (tx) => tx`select 1 from memberships where user_id = ${user.id}`);
  if (existing.length) redirect("/dashboard");

  const [taken] = await sql`select 1 from organizations where slug = ${d.slug}`;
  if (taken) return { error: "That career site address is taken. Please choose another." };

  const [org] = await sql<{ id: string }[]>`
    insert into organizations (slug, name, website, industry, company_size, headquarters, tagline, about, brand_color)
    values (${d.slug}, ${d.name}, ${d.website || null}, ${d.industry || null}, ${d.companySize || null},
            ${d.headquarters || null}, ${d.tagline || null}, ${d.about || null}, ${d.brandColor})
    returning id`;

  await withTenant(org.id, async (tx) => {
    await tx`
      insert into org_settings (org_id, hr_email, default_threshold, default_active_days, default_rounds, departments)
      values (${org.id}, ${d.hrEmail}, ${d.defaultThreshold}, ${d.defaultActiveDays},
              ${tx.json(d.defaultRounds as never)}, ${d.departments})`;
    await tx`insert into memberships (org_id, user_id, role) values (${org.id}, ${user.id}, 'admin')`;
  });

  await startSession(user.id, org.id);
  redirect("/dashboard?welcome=1");
}

export async function updateOrgAction(_: FormState, form: FormData): Promise<FormState> {
  const { org } = await requireOrg();
  const parsed = OrgFields.safeParse(parsePayload(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  await withTenant(org.id, async (tx) => {
    await tx`
      update organizations set name = ${d.name}, website = ${d.website || null}, industry = ${d.industry || null},
        company_size = ${d.companySize || null}, headquarters = ${d.headquarters || null}, tagline = ${d.tagline || null},
        about = ${d.about || null}, brand_color = ${d.brandColor}
      where id = ${org.id}`;
    await tx`
      update org_settings set hr_email = ${d.hrEmail}, default_threshold = ${d.defaultThreshold},
        default_active_days = ${d.defaultActiveDays}, default_rounds = ${tx.json(d.defaultRounds as never)},
        departments = ${d.departments}
      where org_id = ${org.id}`;
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved" };
}
