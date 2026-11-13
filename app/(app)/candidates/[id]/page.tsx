import { ArrowLeft, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addNoteAction, advanceAction, hireAction, rejectAction, shortlistAction } from "@/app/_actions/applications";
import { buttonClass } from "@/components/classes";
import { ApplicationBadge, Badge, Card, formatDate } from "@/components/display";
import { SubmitButton, Textarea } from "@/components/ui";
import { requireOrg } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import type { Application, Job, Round } from "@/lib/types";

export const metadata: Metadata = { title: "Candidate" };

type Event = { id: string; kind: string; detail: string | null; actor: string | null; createdAt: Date };

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { org } = await requireOrg();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const data = await withTenant(org.id, async (tx) => {
    const [app] = await tx<Application[]>`select * from applications where id = ${id}`;
    if (!app) return null;
    const [job] = await tx<Job[]>`select * from jobs where id = ${app.jobId}`;
    const rounds = await tx<Round[]>`select * from job_rounds where job_id = ${app.jobId} order by position`;
    const events = await tx<Event[]>`select id, kind, detail, actor, created_at from application_events where application_id = ${id} order by created_at desc`;
    return { app, job, rounds, events };
  });
  if (!data) notFound();
  const { app, job, rounds, events } = data;

  const currentIndex = rounds.findIndex((r) => r.id === app.currentRoundId);
  const nextRound = app.status === "shortlisted" || app.status === "in_rounds" ? rounds[currentIndex + 1] : undefined;
  const details = app.scoreDetails;
  const open = app.status !== "hired" && app.status !== "rejected";

  return (
    <>
      <Link href={`/jobs/${job.id}`} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft size={14} /> {job.title}
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">{app.name}</h1>
            <ApplicationBadge status={app.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            <a href={`mailto:${app.email}`} className="hover:text-ink">{app.email}</a>
            {app.phone && ` · ${app.phone}`}
            {app.location && ` · ${app.location}`}
          </p>
        </div>
        <a href={`/api/resumes/${app.id}`} className={buttonClass("secondary")}><Download size={14} /> Resume</a>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="p-6">
            {app.scoreStatus === "pending" && <p className="text-sm text-muted">This resume is being scored. Refresh in a moment.</p>}
            {app.scoreStatus === "failed" && (
              <p className="text-sm text-muted">We couldn&apos;t read any text in this resume, which often means it&apos;s a scanned image. Please review the file and decide manually.</p>
            )}
            {app.scoreStatus === "done" && details && (
              <>
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-[13px] font-medium">Resume score</p>
                    <p className="mt-1 text-5xl font-semibold tabular-nums tracking-tight">{app.score}</p>
                    <p className="mt-1 text-[13px] text-muted">
                      {(app.score ?? 0) >= job.threshold ? "Meets" : "Below"} the shortlist score of {job.threshold}
                    </p>
                  </div>
                  <Badge>{app.scoreMethod === "ai" ? "AI assessment" : "Keyword match"}</Badge>
                </div>
                <p className="mt-5 text-sm leading-relaxed">{details.summary}</p>
                <div className="mt-6 space-y-3">
                  {details.breakdown.map((part) => (
                    <div key={part.label}>
                      <div className="mb-1 flex justify-between text-[13px]">
                        <span>{part.label}</span>
                        <span className="tabular-nums text-muted">{part.points} / {part.max}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-wash">
                        <div className="h-full rounded-full bg-ink" style={{ width: `${part.max ? (part.points / part.max) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {(details.matchedSkills.length > 0 || details.missingSkills.length > 0) && (
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <SkillList title="Found" skills={details.matchedSkills} tone="green" />
                    <SkillList title="Not found" skills={details.missingSkills} tone="neutral" />
                  </div>
                )}
                <p className="mt-6 text-xs leading-relaxed text-muted">
                  A screening aid, not a decision. Please review the resume before acting on this score.
                </p>
              </>
            )}
          </Card>

          {(app.coverNote || app.linkedinUrl || app.yearsExperience) && (
            <Card className="p-6">
              <h2 className="text-sm font-semibold">Application</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {app.yearsExperience && <div><dt className="text-[13px] text-muted">Stated experience</dt><dd>{Number(app.yearsExperience)} years</dd></div>}
                {app.linkedinUrl && (
                  <div><dt className="text-[13px] text-muted">LinkedIn</dt>
                    <dd><a href={app.linkedinUrl} target="_blank" rel="noreferrer noopener nofollow" className="break-all underline underline-offset-2">{app.linkedinUrl}</a></dd>
                  </div>
                )}
                {app.coverNote && <div><dt className="text-[13px] text-muted">Note from candidate</dt><dd className="mt-0.5 whitespace-pre-wrap leading-relaxed">{app.coverNote}</dd></div>}
              </dl>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-sm font-semibold">Next step</h2>
            {rounds.length > 0 && (
              <ol className="mt-4 space-y-2">
                {rounds.map((round, index) => {
                  const done = app.status === "hired" || (currentIndex >= 0 && index < currentIndex);
                  const current = index === currentIndex && app.status === "in_rounds";
                  return (
                    <li key={round.id} className="flex items-center gap-2.5 text-[13px]">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${current ? "bg-ink ring-4 ring-wash" : done ? "bg-ink" : "bg-line"}`} />
                      <span className={current ? "font-medium" : done ? "" : "text-muted"}>{round.name}</span>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="mt-5 space-y-2">
              {(app.status === "new" || app.status === "not_shortlisted" || app.status === "rejected") && (
                <form action={shortlistAction.bind(null, app.id)}>
                  <SubmitButton className="w-full" pendingText="Shortlisting…">Shortlist</SubmitButton>
                </form>
              )}
              {nextRound && (
                <form action={advanceAction.bind(null, app.id)} className="space-y-2">
                  <SubmitButton className="w-full" pendingText="Moving…">Move to {nextRound.name}</SubmitButton>
                  <NotifyToggle />
                </form>
              )}
              {app.status === "in_rounds" && (
                <form action={hireAction.bind(null, app.id)}>
                  <SubmitButton variant={nextRound ? "secondary" : "primary"} className="w-full" pendingText="Saving…">Mark as hired</SubmitButton>
                </form>
              )}
              {open && (
                <form action={rejectAction.bind(null, app.id)} className="space-y-2">
                  <SubmitButton variant="danger" className="w-full" pendingText="Rejecting…">Reject</SubmitButton>
                  <NotifyToggle />
                </form>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold">Activity</h2>
            <form action={addNoteAction.bind(null, app.id)} className="mt-4 space-y-2">
              <Textarea name="note" rows={2} placeholder="Add a note for your team" required />
              <SubmitButton variant="secondary" size="sm" pendingText="Adding…">Add note</SubmitButton>
            </form>
            <ul className="mt-5 space-y-4">
              {events.map((event) => (
                <li key={event.id} className="text-[13px]">
                  <p className="whitespace-pre-wrap leading-relaxed">{event.detail ?? event.kind}</p>
                  <p className="mt-0.5 text-xs text-muted">{event.actor ?? "Filtrd"} · {formatDate(event.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

function NotifyToggle() {
  return (
    <label className="flex items-center gap-2 px-1 text-xs text-muted">
      <input type="checkbox" name="notify" defaultChecked className="accent-ink" /> Email the candidate
    </label>
  );
}

function SkillList({ title, skills, tone }: { title: string; skills: string[]; tone: "green" | "neutral" }) {
  if (!skills.length) return <div />;
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium">{title}</p>
      <div className="flex flex-wrap gap-1.5">{skills.map((s) => <Badge key={s} tone={tone}>{s}</Badge>)}</div>
    </div>
  );
}
