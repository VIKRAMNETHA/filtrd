import { ExternalLink, Pencil, Send } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { closeJobAction, publishJobAction, sendShortlistNowAction } from "@/app/_actions/jobs";
import { buttonClass, cx } from "@/components/classes";
import { Card, daysLeft, formatDate, JobStatusBadge, PageHeader, ScorePill } from "@/components/display";
import { SubmitButton } from "@/components/ui";
import { requireOrg } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import type { Application, Job, Round } from "@/lib/types";
import { careerSiteUrl } from "@/lib/urls";

export const metadata: Metadata = { title: "Pipeline" };

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { org } = await requireOrg();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const data = await withTenant(org.id, async (tx) => {
    const [job] = await tx<Job[]>`select * from jobs where id = ${id}`;
    if (!job) return null;
    const rounds = await tx<Round[]>`select * from job_rounds where job_id = ${id} order by position`;
    const applications = await tx<Application[]>`
      select id, name, status, score, score_status, current_round_id, created_at from applications
      where job_id = ${id} order by score desc nulls last, created_at`;
    return { job, rounds, applications };
  });
  if (!data) notFound();
  const { job, rounds, applications } = data;
  const left = daysLeft(job.closesAt);

  const columns = [
    { key: "new", title: "Applied", items: applications.filter((a) => a.status === "new") },
    { key: "shortlisted", title: "Shortlisted", items: applications.filter((a) => a.status === "shortlisted") },
    ...rounds.map((r) => ({
      key: r.id,
      title: r.name,
      items: applications.filter((a) => a.status === "in_rounds" && a.currentRoundId === r.id),
    })),
    { key: "hired", title: "Hired", items: applications.filter((a) => a.status === "hired") },
  ];
  const notShortlisted = applications.filter((a) => a.status === "not_shortlisted");
  const rejected = applications.filter((a) => a.status === "rejected");

  return (
    <>
      <PageHeader
        title={job.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status} />
            {job.status === "published" && <span>Closes {formatDate(job.closesAt)} ({Math.max(left ?? 0, 0)} days left)</span>}
            {job.status === "closed" && <span>{job.shortlistSentAt ? `Shortlist sent ${formatDate(job.shortlistSentAt)}` : "Preparing shortlist…"}</span>}
            {job.status === "draft" && <span>Not visible to candidates yet</span>}
          </span>
        }
        actions={
          <>
            {job.status === "published" && (
              <a href={careerSiteUrl(org.slug, `/jobs/${job.id}`)} target="_blank" rel="noreferrer" className={buttonClass("ghost")}>
                <ExternalLink size={15} /> View posting
              </a>
            )}
            <Link href={`/jobs/${job.id}/edit`} className={buttonClass("secondary")}><Pencil size={14} /> Edit</Link>
            {job.status === "draft" && (
              <form action={publishJobAction.bind(null, job.id)}><SubmitButton pendingText="Publishing…">Publish</SubmitButton></form>
            )}
            {job.status === "published" && (
              <>
                <form action={closeJobAction.bind(null, job.id)}><SubmitButton variant="secondary" pendingText="Closing…">Close role</SubmitButton></form>
                <form action={sendShortlistNowAction.bind(null, job.id)}>
                  <SubmitButton pendingText="Sending…"><Send size={14} /> Send shortlist now</SubmitButton>
                </form>
              </>
            )}
          </>
        }
      />

      <Card className="mb-8 grid grid-cols-2 gap-y-4 px-6 py-4 text-sm sm:grid-cols-4">
        <Setting label="Shortlist score" value={`${job.threshold}+`} />
        <Setting label="Active for" value={`${job.activeDays} days`} />
        <Setting label="Hiring rounds" value={String(rounds.length)} />
        <Setting label="Report goes to" value={job.notifyEmails.join(", ")} />
      </Card>

      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        <div className="flex gap-3">
          {columns.map((column) => (
            <div key={column.key} className="w-60 shrink-0 rounded-card bg-wash p-2">
              <div className="flex items-center justify-between px-2.5 py-2">
                <h2 className="truncate text-[13px] font-semibold">{column.title}</h2>
                <span className="text-xs tabular-nums text-muted">{column.items.length}</span>
              </div>
              <div className="min-h-16 space-y-1.5">
                {column.items.map((a) => <CandidateCard key={a.id} application={a} threshold={job.threshold} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {(notShortlisted.length > 0 || rejected.length > 0) && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Others title="Below threshold" items={notShortlisted} threshold={job.threshold} />
          <Others title="Rejected" items={rejected} threshold={job.threshold} />
        </div>
      )}
    </>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 pr-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 truncate font-medium" title={value}>{value}</p>
    </div>
  );
}

function CandidateCard({ application: a, threshold }: { application: Application; threshold: number }) {
  return (
    <Link href={`/candidates/${a.id}`} className="flex items-center justify-between gap-2 rounded-[14px] border border-line bg-white px-3 py-2.5 transition-colors hover:border-subtle">
      <span className="truncate text-[13px] font-medium">{a.name}</span>
      <ScorePill score={a.score} threshold={threshold} status={a.scoreStatus} />
    </Link>
  );
}

function Others({ title, items, threshold }: { title: string; items: Application[]; threshold: number }) {
  if (!items.length) return <div />;
  return (
    <section>
      <h2 className="mb-2 text-[13px] font-semibold text-muted">{title} ({items.length})</h2>
      <div className={cx("divide-y divide-line rounded-card border border-line")}>
        {items.map((a) => (
          <Link key={a.id} href={`/candidates/${a.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 first:rounded-t-card last:rounded-b-card hover:bg-wash/60">
            <span className="truncate text-[13px]">{a.name}</span>
            <ScorePill score={a.score} threshold={threshold} status={a.scoreStatus} />
          </Link>
        ))}
      </div>
    </section>
  );
}
