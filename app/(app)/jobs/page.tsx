import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/classes";
import { Card, daysLeft, EmptyState, formatDate, JobStatusBadge, PageHeader } from "@/components/display";
import { requireOrg } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import type { JobStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Jobs" };

export default async function JobsPage() {
  const { org } = await requireOrg();
  const jobs = await withTenant(org.id, (tx) => tx<{
    id: string; title: string; department: string | null; location: string | null; status: JobStatus;
    closesAt: Date | null; threshold: number; applicants: number; shortlisted: number; rounds: number;
  }[]>`
    select j.id, j.title, j.department, j.location, j.status, j.closes_at, j.threshold,
      (select count(*)::int from applications a where a.job_id = j.id) as applicants,
      (select count(*)::int from applications a where a.job_id = j.id and a.status in ('shortlisted', 'in_rounds', 'hired')) as shortlisted,
      (select count(*)::int from job_rounds r where r.job_id = j.id) as rounds
    from jobs j order by case j.status when 'published' then 0 when 'draft' then 1 else 2 end, j.created_at desc`);

  return (
    <>
      <PageHeader title="Jobs" actions={<Link href="/jobs/new" className={buttonClass()}><Plus size={16} /> Create job</Link>} />
      {jobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          description="Create a role, set your shortlist score and publish it to your career site."
          action={<Link href="/jobs/new" className={buttonClass()}>Create job</Link>}
        />
      ) : (
        <Card className="divide-y divide-line">
          {jobs.map((job) => {
            const left = daysLeft(job.closesAt);
            return (
              <Link key={job.id} href={`/jobs/${job.id}`} className="grid gap-3 px-6 py-5 first:rounded-t-card last:rounded-b-card hover:bg-wash/60 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <p className="truncate font-medium">{job.title}</p>
                    <JobStatusBadge status={job.status} />
                  </div>
                  <p className="mt-1 text-[13px] text-muted">
                    {[job.department, job.location].filter(Boolean).join(" · ") || "No location set"}
                    {job.status === "published" && left != null && ` · closes in ${Math.max(left, 0)} days`}
                    {job.status === "closed" && ` · closed ${formatDate(job.closesAt)}`}
                  </p>
                </div>
                <dl className="flex gap-6 text-right text-[13px]">
                  <Metric label="Applied" value={job.applicants} />
                  <Metric label="Shortlisted" value={job.shortlisted} />
                  <Metric label="Min score" value={job.threshold} />
                  <Metric label="Rounds" value={job.rounds} />
                </dl>
              </Link>
            );
          })}
        </Card>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="font-semibold tabular-nums">{value}</dd>
      <dt className="text-xs text-muted">{label}</dt>
    </div>
  );
}
