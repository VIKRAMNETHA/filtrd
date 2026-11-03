"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/lib/auth";
import { withTenant, type Tx } from "@/lib/db";
import { esc, flushEmails, layout, queueEmail } from "@/lib/email";
import type { Application, Job, Org, Round } from "@/lib/types";

type Ctx = { tx: Tx; app: Application; job: Job; org: Org; rounds: Round[]; actor: string };

async function withApplication(applicationId: string, fn: (ctx: Ctx) => Promise<void>) {
  const { org, user } = await requireOrg();
  await withTenant(org.id, async (tx) => {
    const [app] = await tx<Application[]>`select * from applications where id = ${applicationId} for update`;
    if (!app) return;
    const [job] = await tx<Job[]>`select * from jobs where id = ${app.jobId}`;
    const rounds = await tx<Round[]>`select * from job_rounds where job_id = ${app.jobId} order by position`;
    await fn({ tx, app, job, org, rounds, actor: user.name });
  });
  await flushEmails(org.id);
  revalidatePath(`/candidates/${applicationId}`);
  revalidatePath("/candidates");
}

async function logEvent({ tx, app, org, actor }: Ctx, kind: string, detail: string) {
  await tx`
    insert into application_events (org_id, application_id, kind, detail, actor)
    values (${org.id}, ${app.id}, ${kind}, ${detail}, ${actor})`;
}

async function notifyCandidate(ctx: Ctx, kind: string, subject: string, body: string) {
  await queueEmail(ctx.tx, ctx.org.id, {
    kind,
    to: [ctx.app.email],
    subject,
    html: layout(ctx.org.name, `<p style="margin:0 0 12px">Hi ${esc(ctx.app.name)},</p>${body}<p style="margin:16px 0 0">The ${esc(ctx.org.name)} hiring team</p>`),
  });
}

/** HR override in either direction: the threshold only proposes, a person decides. */
export async function shortlistAction(applicationId: string) {
  await withApplication(applicationId, async (ctx) => {
    if (!["new", "not_shortlisted", "rejected"].includes(ctx.app.status)) return;
    await ctx.tx`update applications set status = 'shortlisted', current_round_id = null, updated_at = now() where id = ${applicationId}`;
    await logEvent(ctx, "shortlisted", "Shortlisted manually");
  });
}

/** Moves a shortlisted candidate into round one, or an in-process candidate to the next round. */
export async function advanceAction(applicationId: string, form: FormData) {
  const notify = form.get("notify") === "on";
  await withApplication(applicationId, async (ctx) => {
    const { app, rounds, job } = ctx;
    if (app.status !== "shortlisted" && app.status !== "in_rounds") return;
    const current = rounds.findIndex((r) => r.id === app.currentRoundId);
    const next = rounds[current + 1];
    if (!next) return;
    await ctx.tx`
      update applications set status = 'in_rounds', current_round_id = ${next.id}, updated_at = now() where id = ${applicationId}`;
    await logEvent(ctx, "round", `Moved to round ${next.position}: ${next.name}`);
    if (notify) {
      await notifyCandidate(
        ctx,
        "candidate_round",
        `Next step for ${job.title}: ${next.name}`,
        `<p style="margin:0">Good news: your application for <b>${esc(job.title)}</b> is moving forward to the next stage, <b>${esc(next.name)}</b>. We'll be in touch shortly with the details.</p>`,
      );
    }
  });
}

export async function hireAction(applicationId: string) {
  await withApplication(applicationId, async (ctx) => {
    await ctx.tx`update applications set status = 'hired', updated_at = now() where id = ${applicationId}`;
    await logEvent(ctx, "hired", "Marked as hired");
  });
}

export async function rejectAction(applicationId: string, form: FormData) {
  const notify = form.get("notify") === "on";
  await withApplication(applicationId, async (ctx) => {
    await ctx.tx`update applications set status = 'rejected', updated_at = now() where id = ${applicationId}`;
    await logEvent(ctx, "rejected", "Rejected");
    if (notify) {
      await notifyCandidate(
        ctx,
        "candidate_rejected",
        `Your application for ${ctx.job.title}`,
        `<p style="margin:0">Thank you for your interest in <b>${esc(ctx.job.title)}</b>. After careful review, we've decided not to move forward with your application at this time. We wish you the very best in your search.</p>`,
      );
    }
  });
}

export async function addNoteAction(applicationId: string, form: FormData) {
  const note = String(form.get("note") ?? "").trim().slice(0, 2000);
  if (!note) return;
  await withApplication(applicationId, (ctx) => logEvent(ctx, "note", note));
}
