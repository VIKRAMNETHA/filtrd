"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { scoreApplication } from "@/lib/automation";
import { sql, withTenant } from "@/lib/db";
import { esc, flushEmails, layout, queueEmail } from "@/lib/email";
import { allowRequest } from "@/lib/rate-limit";
import { detectResumeType, MAX_RESUME_BYTES } from "@/lib/resume";
import type { FormState } from "@/lib/types";

const Application = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.email("Please enter a valid email address.").max(200),
  phone: z.string().trim().max(40),
  linkedinUrl: z.union([z.literal(""), z.url("Please enter a full LinkedIn URL, starting with https://.").max(300)]),
  location: z.string().trim().max(120),
  yearsExperience: z.union([z.literal(""), z.coerce.number().min(0).max(60)]),
  coverNote: z.string().trim().max(4000),
});

export async function applyAction(slug: string, jobId: string, _: FormState, form: FormData): Promise<FormState> {
  // Bots fill the hidden field. They get a success response and nothing is stored.
  if (form.get("company_website")) return { ok: true };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowRequest(`apply:${ip}`, 20, 60 * 60_000)) {
    return { error: "Too many applications from this connection. Please try again later." };
  }

  const parsed = Application.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone") ?? "",
    linkedinUrl: form.get("linkedinUrl") ?? "",
    location: form.get("location") ?? "",
    yearsExperience: form.get("yearsExperience") ?? "",
    coverNote: form.get("coverNote") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (form.get("consent") !== "on") return { error: "Please confirm you agree to how your application is processed." };

  const file = form.get("resume");
  if (!(file instanceof File) || file.size === 0) return { error: "Please attach your resume." };
  if (file.size > MAX_RESUME_BYTES) return { error: "Your resume must be under 5 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = detectResumeType(bytes, file.name);
  if (!contentType) return { error: "Please upload your resume as a PDF or DOCX file." };

  const [org] = await sql<{ id: string; name: string }[]>`select id, name from organizations where slug = ${slug}`;
  if (!org) return { error: "This career site no longer exists." };

  const d = parsed.data;
  const email = d.email.toLowerCase();
  const years = d.yearsExperience === "" ? null : d.yearsExperience;

  const outcome = await withTenant(org.id, async (tx) => {
    const [job] = await tx<{ title: string }[]>`
      select title from jobs where id = ${jobId} and status = 'published' and closes_at > now() for share`;
    if (!job) return { error: "This role is no longer accepting applications." };

    const [duplicate] = await tx`select 1 from applications where job_id = ${jobId} and lower(email) = ${email}`;
    if (duplicate) return { error: "You've already applied to this role with this email." };

    const [app] = await tx<{ id: string }[]>`
      insert into applications (org_id, job_id, name, email, phone, linkedin_url, location, years_experience, cover_note, consent_at)
      values (${org.id}, ${jobId}, ${d.name}, ${email}, ${d.phone || null}, ${d.linkedinUrl || null}, ${d.location || null},
              ${years}, ${d.coverNote || null}, now())
      on conflict (job_id, lower(email)) do nothing
      returning id`;
    if (!app) return { error: "You've already applied to this role with this email." };

    await tx`
      insert into resumes (application_id, org_id, filename, content_type, data)
      values (${app.id}, ${org.id}, ${file.name.slice(0, 200)}, ${contentType}, ${bytes})`;
    await tx`
      insert into application_events (org_id, application_id, kind, detail)
      values (${org.id}, ${app.id}, 'applied', 'Applied through the career site')`;
    await queueEmail(tx, org.id, {
      kind: "candidate_received",
      to: [email],
      subject: `We received your application for ${job.title}`,
      html: layout(
        org.name,
        `<p style="margin:0 0 12px">Hi ${esc(d.name)},</p>
         <p style="margin:0">Thanks for applying for <b>${esc(job.title)}</b> at ${esc(org.name)}. Our team will review your application and contact you about next steps.</p>`,
      ),
    });
    return { applicationId: app.id };
  });

  if ("error" in outcome) return { error: outcome.error };

  after(async () => {
    await flushEmails(org.id);
    await scoreApplication(org.id, outcome.applicationId);
  });
  return { ok: true };
}
