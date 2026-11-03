"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { runShortlist } from "@/lib/automation";
import { requireOrg } from "@/lib/auth";
import { withTenant, type Tx } from "@/lib/db";
import type { FormState } from "@/lib/types";

const JobFields = z
  .object({
    title: z.string().trim().min(2, "Please enter a job title.").max(140),
    department: z.string().trim().max(80),
    location: z.string().trim().max(120),
    workplace: z.enum(["onsite", "hybrid", "remote"]),
    employmentType: z.enum(["full_time", "part_time", "contract", "internship"]),
    experienceMin: z.number().int().min(0).max(50).nullable(),
    experienceMax: z.number().int().min(0).max(50).nullable(),
    salaryRange: z.string().trim().max(80),
    description: z.string().trim().min(30, "Please write a job description of at least a couple of sentences.").max(20000),
    requiredSkills: z.array(z.string().trim().min(1).max(60)).max(40),
    niceSkills: z.array(z.string().trim().min(1).max(60)).max(40),
    threshold: z.number().int().min(0, "The shortlist score must be between 0 and 100.").max(100, "The shortlist score must be between 0 and 100."),
    activeDays: z.number().int().min(1, "A role must stay open for at least 1 day.").max(365, "A role can stay open for at most 365 days."),
    notifyEmails: z.array(z.email("One of the report recipients isn't a valid email address.")).min(1, "Add at least one email to receive the shortlist.").max(10),
    rounds: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Every round needs a name.").max(80),
          kind: z.enum(["screening", "assessment", "interview", "final"]),
        }),
      )
      .min(1, "Add at least one hiring round.")
      .max(10),
  })
  .refine((d) => d.experienceMin == null || d.experienceMax == null || d.experienceMin <= d.experienceMax, {
    message: "Minimum experience can't be more than the maximum.",
  });

type JobInput = z.infer<typeof JobFields>;

function parse(form: FormData) {
  try {
    return JobFields.safeParse(JSON.parse(String(form.get("payload") ?? "{}")));
  } catch {
    return JobFields.safeParse({});
  }
}

async function replaceRounds(tx: Tx, orgId: string, jobId: string, rounds: JobInput["rounds"]) {
  await tx`delete from job_rounds where job_id = ${jobId}`;
  for (const [index, round] of rounds.entries()) {
    await tx`
      insert into job_rounds (org_id, job_id, position, name, kind)
      values (${orgId}, ${jobId}, ${index + 1}, ${round.name}, ${round.kind})`;
  }
}

async function publish(tx: Tx, jobId: string, activeDays: number) {
  await tx`
    update jobs set status = 'published', published_at = now(), shortlist_sent_at = null,
      closes_at = now() + make_interval(days => ${activeDays}::int), updated_at = now()
    where id = ${jobId}`;
}

export async function createJobAction(_: FormState, form: FormData): Promise<FormState> {
  const { org } = await requireOrg();
  const parsed = parse(form);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const jobId = await withTenant(org.id, async (tx) => {
    const [job] = await tx<{ id: string }[]>`
      insert into jobs (org_id, title, department, location, workplace, employment_type, experience_min, experience_max,
        salary_range, description, required_skills, nice_skills, threshold, active_days, notify_emails)
      values (${org.id}, ${d.title}, ${d.department || null}, ${d.location || null}, ${d.workplace}, ${d.employmentType},
        ${d.experienceMin}, ${d.experienceMax}, ${d.salaryRange || null}, ${d.description},
        ${d.requiredSkills}, ${d.niceSkills}, ${d.threshold}, ${d.activeDays}, ${d.notifyEmails})
      returning id`;
    await replaceRounds(tx, org.id, job.id, d.rounds);
    if (form.get("intent") === "publish") await publish(tx, job.id, d.activeDays);
    return job.id;
  });
  revalidatePath("/jobs");
  redirect(`/jobs/${jobId}`);
}

export async function updateJobAction(jobId: string, _: FormState, form: FormData): Promise<FormState> {
  const { org } = await requireOrg();
  const parsed = parse(form);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const error = await withTenant(org.id, async (tx) => {
    const [job] = await tx<{ id: string; status: string; publishedAt: Date | null }[]>`
      select id, status, published_at from jobs where id = ${jobId} for update`;
    if (!job) return "This job no longer exists.";

    await tx`
      update jobs set title = ${d.title}, department = ${d.department || null}, location = ${d.location || null},
        workplace = ${d.workplace}, employment_type = ${d.employmentType}, experience_min = ${d.experienceMin},
        experience_max = ${d.experienceMax}, salary_range = ${d.salaryRange || null}, description = ${d.description},
        required_skills = ${d.requiredSkills}, nice_skills = ${d.niceSkills}, threshold = ${d.threshold},
        active_days = ${d.activeDays}, notify_emails = ${d.notifyEmails}, updated_at = now()
      where id = ${jobId}`;

    // A live role's deadline follows its active days, counted from when it was published.
    if (job.status === "published" && job.publishedAt) {
      await tx`update jobs set closes_at = published_at + make_interval(days => ${d.activeDays}::int) where id = ${jobId}`;
    }

    // Rounds become fixed once a candidate has entered one, so nobody's position is lost.
    const [inRound] = await tx`select 1 from applications where job_id = ${jobId} and current_round_id is not null limit 1`;
    if (!inRound) {
      await replaceRounds(tx, org.id, jobId, d.rounds);
    }
    if (form.get("intent") === "publish" && job.status !== "published") await publish(tx, jobId, d.activeDays);
    return null;
  });
  if (error) return { error };
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}`);
}

export async function publishJobAction(jobId: string) {
  const { org } = await requireOrg();
  await withTenant(org.id, async (tx) => {
    const [job] = await tx<{ activeDays: number }[]>`select active_days from jobs where id = ${jobId} for update`;
    if (job) await publish(tx, jobId, job.activeDays);
  });
  revalidatePath(`/jobs/${jobId}`);
}

/** Closing early runs the same final shortlist as the deadline does. */
export async function closeJobAction(jobId: string) {
  const { org } = await requireOrg();
  await withTenant(org.id, (tx) => tx`
    update jobs set status = 'closed', updated_at = now() where id = ${jobId} and status = 'published'`);
  after(() => runShortlist(org.id, jobId, { final: true }));
  revalidatePath(`/jobs/${jobId}`);
}

export async function sendShortlistNowAction(jobId: string) {
  const { org } = await requireOrg();
  await runShortlist(org.id, jobId, { final: false });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/emails");
}
