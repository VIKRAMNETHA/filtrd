import { ExternalLink, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/classes";
import { ApplicationBadge, Card, daysLeft, EmptyState, JobStatusBadge, PageHeader, ScorePill } from "@/components/display";
import { requireOrg } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import type { ApplicationStatus, JobStatus } from "@/lib/types";
import { careerSiteUrl } from "@/lib/urls";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { org, user } = await requireOrg();
  const { welcome } = await searchParams;

  const data = await withTenant(org.id, async (tx) => {
    const [stats] = await tx<{ openRoles: number; applicants: number; shortlisted: number; inRounds: number }[]>`
      select
        (select count(*)::int from jobs where status = 'published') as open_roles,
        (select count(*)::int from applications) as applicants,
        (select count(*)::int from applications where status = 'shortlisted') as shortlisted,
        (select count(*)::int from applications where status = 'in_rounds') as in_rounds`;
    const jobs = await tx<{ id: string; title: string; status: JobStatus; closesAt: Date | null; threshold: number; applicants: number; qualifying: number }[]>`
      select j.id, j.title, j.status, j.closes_at, j.threshold,
        count(a.id)::int as applicants, count(a.id) filter (where a.score >= j.threshold)::int as qualifying
      from jobs j left join applications a on a.job_id = j.id
      where j.status <> 'closed'
      group by j.id order by j.status = 'published' desc, j.created_at desc limit 6`;
    const recent = await tx<{ id: string; name: string; jobTitle: string; status: ApplicationStatus; score: number | null; scoreStatus: string; threshold: number }[]>`
      select a.id, a.name, j.title as job_title, a.status, a.score, a.score_status, j.threshold
      from applications a join jobs j on j.id = a.job_id
      order by a.created_at desc limit 6`;
    return { stats, jobs, recent };
  });

  const url = careerSiteUrl(org.slug);
  const stats = [
    { label: "Open roles", value: data.stats.openRoles },
    { label: "Applicants", value: data.stats.applicants },
    { label: "Awaiting HR", value: data.stats.shortlisted },
    { label: "In rounds", value: data.stats.inRounds },
  ];

  return (
    <>
      <PageHeader
        title={welcome ? `${org.name} is ready` : `Hello, ${user.name.split(" ")[0]}`}
        description={
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-ink">
            {url.replace(/^https?:\/\//, "")} <ExternalLink size={12} />
          </a>
        }
        actions={<Link href="/jobs/new" className={buttonClass()}><Plus size={16} /> Create job</Link>}
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="px-5 py-4">
            <p className="text-[13px] text-muted">{stat.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold">Active roles</h2>
          {data.jobs.length === 0 ? (
            <EmptyState
              title="Create your first role"
              description="Set the shortlist score, how long it stays open and the hiring rounds."
              action={<Link href="/jobs/new" className={buttonClass()}>Create job</Link>}
            />
          ) : (
            <Card className="divide-y divide-line">
              {data.jobs.map((job) => {
                const left = daysLeft(job.closesAt);
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center justify-between gap-4 px-5 py-4 first:rounded-t-card last:rounded-b-card hover:bg-wash/60">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{job.title}</p>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {job.applicants} applied · {job.qualifying} at {job.threshold}+
                        {job.status === "published" && left != null && ` · ${Math.max(left, 0)} days left`}
                      </p>
                    </div>
                    <JobStatusBadge status={job.status} />
                  </Link>
                );
              })}
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Recent applicants</h2>
          {data.recent.length === 0 ? (
            <EmptyState title="No applicants yet" description="Applicants appear here as soon as they apply on your career site." />
          ) : (
            <Card className="divide-y divide-line">
              {data.recent.map((a) => (
                <Link key={a.id} href={`/candidates/${a.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 first:rounded-t-card last:rounded-b-card hover:bg-wash/60">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <p className="truncate text-[13px] text-muted">{a.jobTitle}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <ApplicationBadge status={a.status} />
                    <ScorePill score={a.score} threshold={a.threshold} status={a.scoreStatus} />
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
