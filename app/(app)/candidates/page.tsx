import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationBadge, Card, EmptyState, formatDate, PageHeader, ScorePill } from "@/components/display";
import { Input, Select } from "@/components/ui";
import { buttonClass } from "@/components/classes";
import { requireOrg } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import type { ApplicationStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Candidates" };

const STATUSES: ApplicationStatus[] = ["new", "shortlisted", "not_shortlisted", "in_rounds", "hired", "rejected"];

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { org } = await requireOrg();
  const { q = "", status = "" } = await searchParams;
  const search = q.trim();
  const statusFilter = STATUSES.includes(status as ApplicationStatus) ? status : "";

  const rows = await withTenant(org.id, (tx) => tx<{
    id: string; name: string; email: string; jobTitle: string; status: ApplicationStatus;
    score: number | null; scoreStatus: string; threshold: number; createdAt: Date;
  }[]>`
    select a.id, a.name, a.email, j.title as job_title, a.status, a.score, a.score_status, j.threshold, a.created_at
    from applications a join jobs j on j.id = a.job_id
    where (${statusFilter} = '' or a.status = ${statusFilter})
      and (${search} = '' or a.name ilike ${`%${search}%`} or a.email ilike ${`%${search}%`} or j.title ilike ${`%${search}%`})
    order by a.created_at desc limit 200`);

  return (
    <>
      <PageHeader title="Candidates" />
      <form className="mb-5 flex flex-wrap gap-2">
        <Input name="q" defaultValue={search} placeholder="Search by name, email or role" className="!w-72 max-w-full" />
        <Select name="status" defaultValue={statusFilter} className="!w-44" aria-label="Status">
          <option value="">All statuses</option>
          <option value="new">Applied</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="not_shortlisted">Below threshold</option>
          <option value="in_rounds">In rounds</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </Select>
        <button className={buttonClass("secondary")}>Filter</button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title={search || statusFilter ? "No candidates match" : "No candidates yet"} description={search || statusFilter ? "Try a different search or status." : "Candidates appear here when they apply on your career site."} />
      ) : (
        <Card className="divide-y divide-line">
          {rows.map((a) => (
            <Link key={a.id} href={`/candidates/${a.id}`} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 first:rounded-t-card last:rounded-b-card hover:bg-wash/60 sm:grid-cols-[1.2fr_1fr_auto_auto]">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.name}</p>
                <p className="truncate text-[13px] text-muted">{a.email}</p>
              </div>
              <p className="hidden truncate text-[13px] text-muted sm:block">{a.jobTitle} · {formatDate(a.createdAt)}</p>
              <div className="hidden sm:block"><ApplicationBadge status={a.status} /></div>
              <ScorePill score={a.score} threshold={a.threshold} status={a.scoreStatus} />
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
