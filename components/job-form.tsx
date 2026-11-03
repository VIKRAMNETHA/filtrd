"use client";

import { useActionState, useState } from "react";
import { createJobAction, updateJobAction } from "@/app/_actions/jobs";
import type { FormState, Job, Round, RoundInput } from "@/lib/types";
import { cx } from "./classes";
import { RoundsEditor } from "./rounds-editor";
import { TagInput } from "./tag-input";
import { Field, FormError, Input, Select, SubmitButton, Textarea } from "./ui";

type Defaults = { threshold: number; activeDays: number; hrEmail: string; rounds: RoundInput[]; departments: string[] };

const DAY_OPTIONS = [7, 14, 30, 45, 60];

export function JobForm({ defaults, job, rounds, roundsLocked }: { defaults: Defaults; job?: Job; rounds?: Round[]; roundsLocked?: boolean }) {
  const action = job ? updateJobAction.bind(null, job.id) : createJobAction;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const [data, setData] = useState({
    title: job?.title ?? "",
    department: job?.department ?? "",
    location: job?.location ?? "",
    workplace: job?.workplace ?? "onsite",
    employmentType: job?.employmentType ?? "full_time",
    experienceMin: job?.experienceMin ?? (null as number | null),
    experienceMax: job?.experienceMax ?? (null as number | null),
    salaryRange: job?.salaryRange ?? "",
    description: job?.description ?? "",
    requiredSkills: job?.requiredSkills ?? ([] as string[]),
    niceSkills: job?.niceSkills ?? ([] as string[]),
    threshold: job?.threshold ?? defaults.threshold,
    activeDays: job?.activeDays ?? defaults.activeDays,
    notifyEmails: job?.notifyEmails?.length ? job.notifyEmails : [defaults.hrEmail],
    rounds: rounds?.map((r) => ({ name: r.name, kind: r.kind })) ?? defaults.rounds,
  });
  const set = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) => setData((d) => ({ ...d, [key]: value }));
  const toNumber = (value: string) => (value === "" ? null : Number(value));
  const isLive = job?.status === "published";

  return (
    <form action={formAction} className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
      <input type="hidden" name="payload" value={JSON.stringify(data)} />

      <div className="space-y-6">
        <Section title="Role">
          <Field label="Job title">
            <Input autoFocus={!job} value={data.title} placeholder="AI Engineer" onChange={(e) => set("title", e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Department">
              <Input list="departments" value={data.department} onChange={(e) => set("department", e.target.value)} />
              <datalist id="departments">{defaults.departments.map((d) => <option key={d} value={d} />)}</datalist>
            </Field>
            <Field label="Location">
              <Input value={data.location} placeholder="Hyderabad" onChange={(e) => set("location", e.target.value)} />
            </Field>
            <Field label="Workplace">
              <Select value={data.workplace} onChange={(e) => set("workplace", e.target.value as typeof data.workplace)}>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </Select>
            </Field>
            <Field label="Employment type">
              <Select value={data.employmentType} onChange={(e) => set("employmentType", e.target.value as typeof data.employmentType)}>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </Select>
            </Field>
            <Field label="Experience (years)">
              <div className="flex items-center gap-2">
                <Input type="number" min={0} max={50} aria-label="Minimum years" placeholder="Min" value={data.experienceMin ?? ""} onChange={(e) => set("experienceMin", toNumber(e.target.value))} />
                <span className="text-muted">–</span>
                <Input type="number" min={0} max={50} aria-label="Maximum years" placeholder="Max" value={data.experienceMax ?? ""} onChange={(e) => set("experienceMax", toNumber(e.target.value))} />
              </div>
            </Field>
            <Field label="Salary range (optional)">
              <Input value={data.salaryRange} placeholder="₹25–35 LPA" onChange={(e) => set("salaryRange", e.target.value)} />
            </Field>
          </div>
          <Field label="Job description">
            <Textarea rows={10} value={data.description} placeholder="What the role does, what success looks like, and who you're looking for." onChange={(e) => set("description", e.target.value)} />
          </Field>
        </Section>

        <Section title="Skills" description="Resumes are scored against these, so list what actually matters for the role.">
          <div>
            <span className="mb-1.5 block text-[13px] font-medium">Required</span>
            <TagInput label="Required skills" value={data.requiredSkills} onChange={(v) => set("requiredSkills", v)} placeholder="Python, PyTorch, LLMs" />
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium">Nice to have</span>
            <TagInput label="Nice-to-have skills" value={data.niceSkills} onChange={(v) => set("niceSkills", v)} placeholder="Kubernetes, RAG" />
          </div>
        </Section>
      </div>

      <div className="space-y-6 xl:sticky xl:top-10">
        <Section title="Hiring automation">
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="threshold" className="text-[13px] font-medium">Shortlist score</label>
              <span className="text-2xl font-semibold tabular-nums tracking-tight">{data.threshold}</span>
            </div>
            <input id="threshold" type="range" min={0} max={100} step={1} className="mt-2 w-full" value={data.threshold} onChange={(e) => set("threshold", Number(e.target.value))} />
            <p className="mt-1 text-xs leading-relaxed text-muted">Resumes scoring {data.threshold} or above are shortlisted.</p>
          </div>

          <div>
            <span className="mb-2 block text-[13px] font-medium">Active days</span>
            <div className="flex flex-wrap gap-1.5">
              {DAY_OPTIONS.map((days) => (
                <button
                  key={days}
                  type="button"
                  aria-pressed={data.activeDays === days}
                  onClick={() => set("activeDays", days)}
                  className={cx("h-8 rounded-[10px] border px-3 text-[13px] tabular-nums transition-colors", data.activeDays === days ? "border-ink bg-ink text-white" : "border-line hover:bg-wash")}
                >
                  {days}
                </button>
              ))}
              <Input type="number" min={1} max={365} aria-label="Custom active days" placeholder="Custom" className="!h-8 !w-20 !px-2.5 text-[13px]" value={DAY_OPTIONS.includes(data.activeDays) ? "" : data.activeDays || ""} onChange={(e) => set("activeDays", Number(e.target.value))} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">The role closes {data.activeDays} days after publishing, then the shortlist is sent.</p>
          </div>

          <div>
            <span className="mb-1.5 block text-[13px] font-medium">Send shortlist to</span>
            <TagInput label="Shortlist recipients" value={data.notifyEmails} onChange={(v) => set("notifyEmails", v)} placeholder="hr@company.com" />
          </div>
        </Section>

        <Section title={`Hiring rounds (${data.rounds.length})`} description={roundsLocked ? "Rounds are fixed now that candidates have entered them." : undefined}>
          <RoundsEditor rounds={data.rounds} onChange={(v) => set("rounds", v)} disabled={roundsLocked} />
        </Section>

        <FormError message={state.error} />

        <div className="flex gap-2">
          {isLive ? (
            <SubmitButton name="intent" value="save" className="flex-1" pendingText="Saving…">Save changes</SubmitButton>
          ) : (
            <>
              <SubmitButton name="intent" value="save" variant="secondary" className="flex-1">Save draft</SubmitButton>
              <SubmitButton name="intent" value="publish" className="flex-1">Publish</SubmitButton>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line p-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

