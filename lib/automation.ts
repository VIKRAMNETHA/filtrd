import { sql, withTenant } from "./db";
import { button, esc, flushEmails, layout, queueEmail } from "./email";
import { extractResumeText } from "./resume";
import { scoreResume } from "./scoring";
import type { Application, Job, Org } from "./types";
import { appUrl } from "./urls";

/** Extracts and scores one resume. The LLM call runs outside any transaction so it holds no connection. */
export async function scoreApplication(orgId: string, applicationId: string) {
  const loaded = await withTenant(orgId, async (tx) => {
    const [row] = await tx<(Application & { contentType: string; data: Uint8Array })[]>`
      select a.*, r.content_type, r.data from applications a
      join resumes r on r.application_id = a.id
      where a.id = ${applicationId} and a.score_status = 'pending'`;
    if (!row) return null;
    const [job] = await tx<Job[]>`select * from jobs where id = ${row.jobId}`;
    return { row, job };
  });
  if (!loaded) return;
  const { row, job } = loaded;

  let text = "";
  try {
    text = await extractResumeText(row.data, row.contentType);
  } catch (error) {
    console.error(`Resume extraction failed for application ${applicationId}:`, error);
  }

  // Scanned or unreadable resumes go to a person; they must not silently score zero.
  if (text.length < 40) {
    await withTenant(orgId, async (tx) => {
      await tx`update applications set score_status = 'failed', updated_at = now() where id = ${applicationId}`;
      await tx`
        insert into application_events (org_id, application_id, kind, detail)
        values (${orgId}, ${applicationId}, 'score_failed', 'No readable text in the resume. Needs manual review.')`;
    });
    return;
  }

  const years = row.yearsExperience == null ? null : Number(row.yearsExperience);
  const result = await scoreResume(job, text, years);

  await withTenant(orgId, async (tx) => {
    await tx`
      update applications set
        score = ${result.score}, score_status = 'done', score_method = ${result.method},
        score_details = ${tx.json(result.details as never)}, resume_text = ${text}, updated_at = now()
      where id = ${applicationId}`;
    await tx`
      insert into application_events (org_id, application_id, kind, detail)
      values (${orgId}, ${applicationId}, 'scored', ${`Resume scored ${result.score}/100`})`;
  });
}

async function scorePending(orgId: string, jobId?: string) {
  const pending = await withTenant(orgId, (tx) => tx<{ id: string }[]>`
    select id from applications
    where score_status = 'pending' and (${jobId ?? null}::uuid is null or job_id = ${jobId ?? null}::uuid)`);
  for (const { id } of pending) {
    try {
      await scoreApplication(orgId, id);
    } catch (error) {
      console.error(`Scoring failed for application ${id}:`, error);
    }
  }
}

function shortlistEmail(org: Org, job: Job, shortlisted: Application[], total: number, needsReview: number, final: boolean) {
  const rows = shortlisted
    .map(
      (a) => `<tr>
        <td style="padding:12px 0;border-top:1px solid #f0f0f0;vertical-align:top">
          <a href="${esc(appUrl(`/candidates/${a.id}`))}" style="color:#111;font-weight:600;text-decoration:none">${esc(a.name)}</a>
          <div style="color:#777;font-size:13px">${esc(a.email)}</div>
          <div style="color:#555;font-size:13px;margin-top:4px">${esc(a.scoreDetails?.summary)}</div>
        </td>
        <td style="padding:12px 0 12px 16px;border-top:1px solid #f0f0f0;vertical-align:top;text-align:right;font-weight:600">${a.score}</td>
      </tr>`,
    )
    .join("");
  const lead = final
    ? `Applications for <b>${esc(job.title)}</b> have closed.`
    : `Here is the shortlist so far for <b>${esc(job.title)}</b>. The role is still accepting applications.`;
  return layout(
    org.name,
    `<h2 style="margin:0 0 8px;font-size:18px">${shortlisted.length} candidate${shortlisted.length === 1 ? "" : "s"} shortlisted</h2>
     <p style="margin:0 0 16px;color:#555">${lead} ${total} applied and ${shortlisted.length} scored ${job.threshold} or above.
     ${needsReview ? `${needsReview} couldn't be scored automatically and need manual review.` : ""}</p>
     ${shortlisted.length ? `<table style="width:100%;border-collapse:collapse;margin-bottom:20px">${rows}</table>` : ""}
     ${button(appUrl(`/jobs/${job.id}`), "Open pipeline")}
     <p style="margin:20px 0 0;color:#8a8a8a;font-size:12px">Scores are a screening aid. Please review candidates before making decisions.</p>`,
  );
}

/**
 * Applies the job's threshold and emails the result to HR. `final` closes out the role and runs
 * once only; an interim run sends the current shortlist and leaves the role open.
 */
export async function runShortlist(orgId: string, jobId: string, { final }: { final: boolean }) {
  await scorePending(orgId, jobId);

  const sent = await withTenant(orgId, async (tx) => {
    const [job] = await tx<Job[]>`select * from jobs where id = ${jobId} for update`;
    if (!job || (final && job.shortlistSentAt)) return false;

    if (final) await tx`update jobs set status = 'closed', shortlist_sent_at = now(), updated_at = now() where id = ${jobId}`;

    const promoted = await tx<{ id: string; status: string }[]>`
      update applications set
        status = case when score >= ${job.threshold} then 'shortlisted' else 'not_shortlisted' end,
        updated_at = now()
      where job_id = ${jobId} and status = 'new' and score_status = 'done'
      returning id, status`;
    for (const a of promoted) {
      await tx`
        insert into application_events (org_id, application_id, kind, detail)
        values (${orgId}, ${a.id}, ${a.status},
          ${a.status === "shortlisted" ? `Shortlisted: met the threshold of ${job.threshold}` : `Below the threshold of ${job.threshold}`})`;
    }

    const all = await tx<Application[]>`select * from applications where job_id = ${jobId} order by score desc nulls last`;
    const shortlisted = all.filter((a) => a.status === "shortlisted");
    const needsReview = all.filter((a) => a.scoreStatus === "failed").length;
    const [org] = await tx<Org[]>`select * from organizations where id = ${orgId}`;
    const [settings] = await tx<{ hrEmail: string }[]>`select hr_email from org_settings where org_id = ${orgId}`;

    await queueEmail(tx, orgId, {
      kind: "shortlist_report",
      to: job.notifyEmails.length ? job.notifyEmails : [settings.hrEmail],
      subject: `${shortlisted.length} shortlisted for ${job.title}`,
      html: shortlistEmail(org, job, shortlisted, all.length, needsReview, final),
    });
    return true;
  });

  if (sent) await flushEmails(orgId);
  return sent;
}

/** One automation pass: closes expired roles, finishes scoring, and retries queued mail. */
export async function tick() {
  const due = await sql<{ orgId: string; jobId: string }[]>`select * from app_due_jobs()`;
  for (const { orgId, jobId } of due) {
    try {
      await runShortlist(orgId, jobId, { final: true });
    } catch (error) {
      console.error(`Shortlist failed for job ${jobId}:`, error);
    }
  }

  const orgs = await sql<{ orgId: string }[]>`select * from app_orgs_with_pending_work()`;
  for (const { orgId } of orgs) {
    try {
      await scorePending(orgId);
      await flushEmails(orgId);
    } catch (error) {
      console.error(`Automation failed for org ${orgId}:`, error);
    }
  }
  return { closedJobs: due.length, orgsProcessed: orgs.length };
}
