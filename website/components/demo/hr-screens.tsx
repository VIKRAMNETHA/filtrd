"use client";

import { ArrowLeft, Check, ExternalLink, FastForward, Plus, Send, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { AI_ENGINEER } from "@/lib/demo/data";
import { daysLeft } from "@/lib/demo/store";
import type { Candidate, CandidateStatus, Job } from "@/lib/demo/types";
import { Badge, Button, Card, Field, Input, ScorePill, Select, Textarea, cx, type Tone } from "../ui";
import { useDemo } from "./context";

const STATUS: Record<CandidateStatus, { label: string; tone: Tone }> = {
  new: { label: "Applied", tone: "neutral" },
  shortlisted: { label: "Shortlisted", tone: "green" },
  not_shortlisted: { label: "Below threshold", tone: "neutral" },
  in_rounds: { label: "In rounds", tone: "blue" },
  hired: { label: "Hired", tone: "ink" },
  rejected: { label: "Rejected", tone: "red" },
};

export function JobBadge({ job }: { job: Job }) {
  if (job.status === "published") return <Badge tone="green">Live</Badge>;
  if (job.status === "closed") return <Badge>Closed</Badge>;
  return <Badge tone="amber">Draft</Badge>;
}

function Header({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Onboarding() {
  const { state, dispatch, go } = useDemo();
  const [step, setStep] = useState(0);
  const [org, setOrg] = useState({ name: state.org.name, slug: state.org.slug, tagline: state.org.tagline, brand: state.org.brand, hrEmail: state.org.hrEmail });
  const [defaults, setDefaults] = useState({ threshold: 60, days: 14 });
  const steps = ["Organization", "Career site", "Hiring defaults"];

  return (
    <div className="mx-auto max-w-lg py-4">
      <ol className="mb-8 flex gap-2">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-2">
            <span className={cx("h-1 rounded-full", i <= step ? "bg-ink" : "bg-line")} />
            <span className={cx("text-xs", i === step ? "font-medium" : "text-subtle")}>{label}</span>
          </li>
        ))}
      </ol>
      {state.org.onboarded && <p className="mb-5 rounded-control bg-emerald-50 px-4 py-3 text-sm text-emerald-800">This workspace is already set up. You can still look around.</p>}
      <div className="space-y-5">
        {step === 0 && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Tell us about your organization</h1>
            <Field label="Organization name"><Input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Industry"><Select defaultValue="Technology"><option>Technology</option><option>Healthcare</option><option>Retail</option></Select></Field>
              <Field label="Company size"><Select defaultValue="51–200"><option>11–50</option><option>51–200</option><option>201–1,000</option></Select></Field>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Set up your career site</h1>
            <Field label="Career site address">
              <div className="flex items-center rounded-control border border-line focus-within:border-ink">
                <input aria-label="Subdomain" className="h-10 min-w-0 flex-1 rounded-l-control bg-transparent pl-3.5 text-sm focus:outline-none" value={org.slug} onChange={(e) => setOrg({ ...org, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
                <span className="pr-3.5 text-sm text-muted">.filtrd.in</span>
              </div>
            </Field>
            <Field label="Tagline"><Input value={org.tagline} onChange={(e) => setOrg({ ...org, tagline: e.target.value })} /></Field>
            <div>
              <span className="mb-2 block text-[13px] font-medium">Brand colour</span>
              <div className="flex gap-2">
                {["#2563eb", "#0f766e", "#7c3aed", "#be123c", "#111111"].map((c) => (
                  <button key={c} type="button" aria-label={`Use ${c}`} aria-pressed={org.brand === c} onClick={() => setOrg({ ...org, brand: c })} className="grid h-8 w-8 place-items-center rounded-full" style={{ background: c }}>
                    {org.brand === c && <Check size={14} color="#fff" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Set your hiring defaults</h1>
            <Field label="HR email" hint="Shortlists are emailed here."><Input value={org.hrEmail} onChange={(e) => setOrg({ ...org, hrEmail: e.target.value })} /></Field>
            <Field label={`Shortlist score: ${defaults.threshold}`} hint="Resumes at or above this score are shortlisted.">
              <input type="range" min={0} max={100} step={5} className="mt-2 w-full" value={defaults.threshold} onChange={(e) => setDefaults({ ...defaults, threshold: Number(e.target.value) })} />
            </Field>
            <Field label="Days a role stays open"><Input type="number" min={1} max={365} value={defaults.days} onChange={(e) => setDefaults({ ...defaults, days: Number(e.target.value) })} /></Field>
          </>
        )}
      </div>
      <div className="mt-8 flex justify-between">
        {step > 0 ? <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button> : <span />}
        {step < 2 ? (
          <Button onClick={() => setStep(step + 1)}>Continue</Button>
        ) : (
          <Button
            onClick={() => {
              dispatch({ type: "onboard", org: { ...org, slug: org.slug || "acme" } });
              go({ name: "dashboard" });
            }}
          >
            Create workspace
          </Button>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { state, go } = useDemo();
  const stats = [
    { label: "Open roles", value: state.jobs.filter((j) => j.status === "published").length },
    { label: "Applicants", value: state.candidates.length },
    { label: "Awaiting HR", value: state.candidates.filter((c) => c.status === "shortlisted").length },
    { label: "In rounds", value: state.candidates.filter((c) => c.status === "in_rounds").length },
  ];
  const recent = [...state.candidates].sort((a, b) => b.appliedDay - a.appliedDay).slice(0, 6);

  return (
    <>
      <Header title={`Hello, Priya`} sub={`${state.org.slug}.filtrd.in · Day ${state.day}`} actions={<Button onClick={() => go({ name: "new-job" })}><Plus size={15} /> Create job</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="px-4 py-3.5">
            <p className="text-[13px] text-muted">{s.label}</p>
            <p className="mt-0.5 text-3xl font-semibold tabular-nums tracking-tight">{s.value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold">Roles</h2>
          <JobList />
        </section>
        <section>
          <h2 className="mb-3 text-sm font-semibold">Recent applicants</h2>
          <Card className="divide-y divide-line">
            {recent.map((c) => (
              <CandidateRow key={c.id} candidate={c} />
            ))}
          </Card>
        </section>
      </div>
    </>
  );
}

function CandidateRow({ candidate: c }: { candidate: Candidate }) {
  const { state, go } = useDemo();
  const job = state.jobs.find((j) => j.id === c.jobId)!;
  return (
    <button type="button" onClick={() => go({ name: "candidate", candidateId: c.id })} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left first:rounded-t-card last:rounded-b-card hover:bg-wash/60">
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{c.name}</span>
        <span className="block truncate text-[13px] text-muted">{job.title}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="hidden sm:inline"><Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge></span>
        <ScorePill score={c.result.score} threshold={job.threshold} />
      </span>
    </button>
  );
}

function JobList() {
  const { state, go } = useDemo();
  return (
    <Card className="divide-y divide-line">
      {state.jobs.map((job) => {
        const applied = state.candidates.filter((c) => c.jobId === job.id).length;
        const left = daysLeft(job, state.day);
        return (
          <button key={job.id} type="button" onClick={() => go(job.status === "draft" ? { name: "new-job" } : { name: "pipeline", jobId: job.id })} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left first:rounded-t-card last:rounded-b-card hover:bg-wash/60">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{job.title}</span>
              <span className="block text-[13px] text-muted">
                {applied} applied · score {job.threshold}+{job.status === "published" && left != null ? ` · ${left} days left` : ""}
              </span>
            </span>
            <JobBadge job={job} />
          </button>
        );
      })}
    </Card>
  );
}

export function Jobs() {
  const { go } = useDemo();
  return (
    <>
      <Header title="Jobs" actions={<Button onClick={() => go({ name: "new-job" })}><Plus size={15} /> Create job</Button>} />
      <JobList />
    </>
  );
}

export function NewJob() {
  const { state, dispatch, go } = useDemo();
  const draft = state.jobs.find((j) => j.id === "job-ai" && j.status === "draft");
  const [job, setJob] = useState<Job>(() => draft ?? { ...AI_ENGINEER, id: `job-${state.nextId}-${Date.now()}`, title: "", description: "", requiredSkills: [], niceSkills: [] });
  const [skills, setSkills] = useState(job.requiredSkills.join(", "));
  const [error, setError] = useState<string>();

  const save = (publish: boolean) => {
    if (job.title.trim().length < 2) return setError("Please enter a job title.");
    if (!job.rounds.every((r) => r.trim())) return setError("Every round needs a name.");
    const finalJob = { ...job, requiredSkills: skills.split(",").map((s) => s.trim()).filter(Boolean) };
    dispatch({ type: "saveJob", job: finalJob, publish });
    go(publish ? { name: "pipeline", jobId: finalJob.id } : { name: "jobs" });
  };

  return (
    <>
      <Header title="Create job" sub={draft ? "We've filled in an example role. Change anything you like." : undefined} />
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="space-y-5 p-5 sm:p-6">
          <Field label="Job title"><Input value={job.title} placeholder="AI Engineer" onChange={(e) => setJob({ ...job, title: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Department"><Input value={job.department} onChange={(e) => setJob({ ...job, department: e.target.value })} /></Field>
            <Field label="Location"><Input value={job.location} onChange={(e) => setJob({ ...job, location: e.target.value })} /></Field>
            <Field label="Workplace">
              <Select value={job.workplace} onChange={(e) => setJob({ ...job, workplace: e.target.value as Job["workplace"] })}>
                <option>On-site</option><option>Hybrid</option><option>Remote</option>
              </Select>
            </Field>
          </div>
          <Field label="Job description"><Textarea rows={5} value={job.description} onChange={(e) => setJob({ ...job, description: e.target.value })} /></Field>
          <Field label="Required skills" hint="Separate with commas. Resumes are scored against these."><Input value={skills} onChange={(e) => setSkills(e.target.value)} /></Field>
        </Card>
        <div className="space-y-5">
          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Hiring automation</h2>
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="threshold" className="text-[13px] font-medium">Shortlist score</label>
                <span className="text-2xl font-semibold tabular-nums">{job.threshold}</span>
              </div>
              <input id="threshold" type="range" min={0} max={100} className="mt-2 w-full" value={job.threshold} onChange={(e) => setJob({ ...job, threshold: Number(e.target.value) })} />
            </div>
            <div>
              <span className="mb-2 block text-[13px] font-medium">Active days</span>
              <div className="flex flex-wrap gap-1.5">
                {[7, 14, 30, 45].map((d) => (
                  <button key={d} type="button" aria-pressed={job.activeDays === d} onClick={() => setJob({ ...job, activeDays: d })} className={cx("h-8 rounded-[10px] border px-3 text-[13px] tabular-nums", job.activeDays === d ? "border-ink bg-ink text-white" : "border-line hover:bg-wash")}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-2 block text-[13px] font-medium">Rounds</span>
              <div className="space-y-2">
                {job.rounds.map((round, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-4 text-center font-mono text-xs text-subtle">{i + 1}</span>
                    <Input aria-label={`Round ${i + 1}`} value={round} onChange={(e) => setJob({ ...job, rounds: job.rounds.map((r, j) => (j === i ? e.target.value : r)) })} />
                  </div>
                ))}
                <Button variant="secondary" size="sm" className="ml-6" disabled={job.rounds.length >= 6} onClick={() => setJob({ ...job, rounds: [...job.rounds, ""] })}><Plus size={13} /> Add round</Button>
              </div>
            </div>
          </Card>
          {error && <p role="alert" className="rounded-control bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => save(false)}>Save draft</Button>
            <Button className="flex-1" onClick={() => save(true)}>Publish</Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function Pipeline({ jobId }: { jobId: string }) {
  const { state, dispatch, go, simulate, simulating } = useDemo();
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job) return <p className="text-sm text-muted">This job doesn&apos;t exist.</p>;
  const all = state.candidates.filter((c) => c.jobId === jobId).sort((a, b) => b.result.score - a.result.score);
  const waiting = state.queue.filter((a) => a.jobId === jobId).length;
  const left = daysLeft(job, state.day);
  const columns: { key: string; title: string; items: Candidate[] }[] = [
    { key: "new", title: "Applied", items: all.filter((c) => c.status === "new") },
    { key: "short", title: "Shortlisted", items: all.filter((c) => c.status === "shortlisted") },
    ...job.rounds.map((r, i) => ({ key: `r${i}`, title: r, items: all.filter((c) => c.status === "in_rounds" && c.roundIndex === i) })),
    { key: "hired", title: "Hired", items: all.filter((c) => c.status === "hired") },
  ];
  const below = all.filter((c) => c.status === "not_shortlisted" || c.status === "rejected");

  return (
    <>
      <Header
        title={job.title}
        sub={
          <span className="flex flex-wrap items-center gap-2">
            <JobBadge job={job} />
            {job.status === "published" && <span>Closes in {left} days · shortlist score {job.threshold}+</span>}
            {job.status === "closed" && <span>Closed · shortlist emailed to HR</span>}
          </span>
        }
        actions={
          <>
            {job.status === "draft" && <Button onClick={() => dispatch({ type: "publish", jobId })}>Publish</Button>}
            {job.status === "published" && (
              <>
                <Button variant="ghost" onClick={() => go({ name: "career", jobId })}><ExternalLink size={14} /> View posting</Button>
                {waiting > 0 && (
                  <Button variant="secondary" disabled={simulating} onClick={simulate}><UserPlus size={14} /> {simulating ? "Applicants arriving…" : `Simulate ${waiting} applications`}</Button>
                )}
                <Button variant="secondary" onClick={() => dispatch({ type: "sendShortlist", jobId })}><Send size={14} /> Send shortlist now</Button>
                <Button onClick={() => { dispatch({ type: "advanceDays", days: left ?? 0 }); }}><FastForward size={14} /> Skip {left} days to close</Button>
              </>
            )}
            {job.status === "closed" && <Button variant="secondary" onClick={() => go({ name: "emails" })}>See the shortlist email</Button>}
          </>
        }
      />
      {all.length === 0 && job.status === "published" && (
        <p className="mb-5 rounded-control bg-wash px-4 py-3 text-sm text-muted">
          No applicants yet. {waiting ? "Click “Simulate applications” to watch resumes arrive and get scored." : "Share your career site to start receiving applications."}
        </p>
      )}
      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        <div className="flex gap-3">
          {columns.map((col) => (
            <div key={col.key} className="w-56 shrink-0 rounded-card bg-wash p-2">
              <div className="flex items-center justify-between px-2 py-2">
                <h2 className="truncate text-[13px] font-semibold">{col.title}</h2>
                <span className="text-xs tabular-nums text-muted">{col.items.length}</span>
              </div>
              <div className="min-h-14 space-y-1.5">
                {col.items.map((c) => (
                  <button key={c.id} type="button" onClick={() => go({ name: "candidate", candidateId: c.id })} className="animate-rise flex w-full items-center justify-between gap-2 rounded-[14px] border border-line bg-white px-3 py-2.5 text-left hover:border-subtle">
                    <span className="truncate text-[13px] font-medium">{c.name}</span>
                    <ScorePill score={c.result.score} threshold={job.threshold} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {below.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-[13px] font-semibold text-muted">Below threshold or rejected ({below.length})</h2>
          <Card className="divide-y divide-line">
            {below.map((c) => (
              <CandidateRow key={c.id} candidate={c} />
            ))}
          </Card>
        </section>
      )}
    </>
  );
}

export function CandidateView({ candidateId }: { candidateId: string }) {
  const { state, dispatch, go } = useDemo();
  const [note, setNote] = useState("");
  const c = state.candidates.find((x) => x.id === candidateId);
  if (!c) {
    return (
      <div className="py-10 text-center text-sm text-muted">
        This candidate hasn&apos;t applied yet.{" "}
        <button type="button" className="font-medium text-ink underline" onClick={() => go({ name: "pipeline", jobId: "job-ai" })}>Open the pipeline</button>
      </div>
    );
  }
  const job = state.jobs.find((j) => j.id === c.jobId)!;
  const next = c.status === "shortlisted" || c.status === "in_rounds" ? job.rounds[c.roundIndex + 1] : undefined;
  const open = c.status !== "hired" && c.status !== "rejected";

  return (
    <>
      <button type="button" onClick={() => go({ name: "pipeline", jobId: job.id })} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft size={14} /> {job.title}
      </button>
      <Header title={c.name} sub={`${c.headline} · ${c.location} · ${c.years} years`} actions={<Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>} />
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium">Resume score</p>
                <p className="mt-1 text-5xl font-semibold tabular-nums tracking-tight">{c.result.score}</p>
                <p className="mt-1 text-[13px] text-muted">{c.result.score >= job.threshold ? "Meets" : "Below"} the shortlist score of {job.threshold}</p>
              </div>
              <Badge>Keyword match</Badge>
            </div>
            <p className="mt-4 text-sm">{c.result.summary}</p>
            <div className="mt-5 space-y-3">
              {c.result.breakdown.map((b) => (
                <div key={b.label}>
                  <div className="mb-1 flex justify-between text-[13px]"><span>{b.label}</span><span className="tabular-nums text-muted">{b.points} / {b.max}</span></div>
                  <div className="h-1.5 rounded-full bg-wash"><div className="h-full rounded-full bg-ink" style={{ width: `${b.max ? (b.points / b.max) * 100 : 0}%` }} /></div>
                </div>
              ))}
            </div>
            {(c.result.matchedSkills.length > 0 || c.result.missingSkills.length > 0) && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {c.result.matchedSkills.map((s) => <Badge key={s} tone="green">{s}</Badge>)}
                {c.result.missingSkills.map((s) => <Badge key={s} className="line-through decoration-subtle">{s}</Badge>)}
              </div>
            )}
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="mb-2 text-sm font-semibold">Resume</h2>
            <p className="text-sm leading-relaxed text-muted">{c.resume}</p>
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-sm font-semibold">Next step</h2>
            <ol className="mt-3 space-y-2">
              {job.rounds.map((r, i) => {
                const done = c.status === "hired" || (c.status === "in_rounds" && i < c.roundIndex);
                const current = c.status === "in_rounds" && i === c.roundIndex;
                return (
                  <li key={r} className="flex items-center gap-2.5 text-[13px]">
                    <span className={cx("h-2 w-2 rounded-full", current ? "bg-ink ring-4 ring-wash" : done ? "bg-ink" : "bg-line")} />
                    <span className={current ? "font-medium" : done ? "" : "text-muted"}>{r}</span>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 space-y-2">
              {["new", "not_shortlisted", "rejected"].includes(c.status) && <Button className="w-full" onClick={() => dispatch({ type: "shortlist", candidateId: c.id })}>Shortlist</Button>}
              {next && <Button className="w-full" onClick={() => dispatch({ type: "advance", candidateId: c.id })}>Move to {next}</Button>}
              {c.status === "in_rounds" && <Button variant={next ? "secondary" : "primary"} className="w-full" onClick={() => dispatch({ type: "hire", candidateId: c.id })}>Mark as hired</Button>}
              {open && <Button variant="danger" className="w-full" onClick={() => dispatch({ type: "reject", candidateId: c.id })}>Reject</Button>}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-sm font-semibold">Activity</h2>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim()) dispatch({ type: "note", candidateId: c.id, text: note.trim() });
                setNote("");
              }}
            >
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" aria-label="Add a note" />
              <Button type="submit" variant="secondary">Add</Button>
            </form>
            <ul className="mt-4 space-y-3">
              {[...c.events].reverse().map((e, i) => (
                <li key={i} className="text-[13px]">
                  <p>{e.text}</p>
                  <p className="text-xs text-muted">{e.actor} · Day {e.day}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

export function Emails({ emailId }: { emailId?: string }) {
  const { state, go } = useDemo();
  const selected = state.emails.find((e) => e.id === emailId) ?? state.emails[0];

  if (!state.emails.length) {
    return (
      <>
        <Header title="Emails" />
        <div className="rounded-card border border-dashed border-line px-6 py-14 text-center">
          <p className="text-sm font-medium">No emails yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">When a role closes, HR receives the shortlist here, and in their inbox.</p>
        </div>
      </>
    );
  }

  const job = state.jobs.find((j) => j.id === selected.jobId)!;
  const people = selected.candidateIds.map((id) => state.candidates.find((c) => c.id === id)!).filter(Boolean);
  return (
    <>
      <Header title="Emails" sub="What HR receives. In the demo, nothing is actually sent." />
      <div className="grid items-start gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="divide-y divide-line">
          {state.emails.map((e) => (
            <button key={e.id} type="button" onClick={() => go({ name: "emails", emailId: e.id })} className={cx("block w-full px-4 py-3 text-left first:rounded-t-card last:rounded-b-card", e.id === selected.id ? "bg-wash" : "hover:bg-wash/60")}>
              <span className="block truncate text-sm font-medium">{e.subject}</span>
              <span className="block truncate text-xs text-muted">To {e.to} · Day {e.day}</span>
            </button>
          ))}
        </Card>
        <Card className="p-5 sm:p-8">
          <p className="text-xs text-muted">From Filtrd · To {selected.to}</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">{selected.subject}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{selected.body}</p>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {people.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => go({ name: "candidate", candidateId: c.id })} className="flex w-full items-start justify-between gap-4 py-3 text-left hover:bg-wash/40">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{c.name}</span>
                    <span className="block text-[13px] text-muted">{c.result.summary}</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{c.result.score}</span>
                </button>
              </li>
            ))}
          </ul>
          <Button className="mt-5" onClick={() => go({ name: "pipeline", jobId: job.id })}><Users size={14} /> Open pipeline</Button>
          <p className="mt-5 text-xs text-subtle">Scores are a screening aid. Please review candidates before making decisions.</p>
        </Card>
      </div>
    </>
  );
}
