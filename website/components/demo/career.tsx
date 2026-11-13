"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { useState } from "react";
import { Field, Input, Textarea } from "../ui";
import { useDemo } from "./context";

const SAMPLE_RESUME =
  "AI engineer with 4 years building LLM features in Python and PyTorch. Built a RAG search assistant, evaluation pipelines and model serving on Kubernetes.";

/** The tenant's public career site, shown inside a browser frame so it reads as a separate website. */
export function CareerSite({ jobId, apply }: { jobId?: string; apply?: boolean }) {
  const { state, dispatch, go } = useDemo();
  const [form, setForm] = useState({ name: "", email: "", years: "4", resume: SAMPLE_RESUME });
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const live = state.jobs.filter((j) => j.status === "published");
  const job = jobId ? state.jobs.find((j) => j.id === jobId && j.status === "published") : undefined;
  const path = job ? `/jobs/${job.id.replace("job-", "")}${apply ? "/apply" : ""}` : "";
  const brand = state.org.brand;

  const submit = () => {
    if (!job) return;
    if (form.name.trim().length < 2) return setError("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Please enter a valid email.");
    if (state.candidates.some((c) => c.jobId === job.id && c.email.toLowerCase() === form.email.toLowerCase())) return setError("You've already applied with this email.");
    dispatch({ type: "apply", jobId: job.id, name: form.name.trim(), email: form.email.trim(), years: Number(form.years) || 0, resume: form.resume });
    setSubmitted(form.name.trim());
    setError(undefined);
  };

  return (
    <div className="overflow-hidden rounded-card border border-line shadow-[0_1px_0_rgba(0,0,0,0.02),0_20px_50px_-30px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2 border-b border-line bg-wash px-3 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-line" /><span className="h-2.5 w-2.5 rounded-full bg-line" /><span className="h-2.5 w-2.5 rounded-full bg-line" />
        </span>
        <span className="mx-auto flex min-w-0 max-w-md flex-1 items-center justify-center gap-1.5 truncate rounded-lg bg-white px-3 py-1 text-xs text-muted">
          <Lock size={10} /> {state.org.slug}.filtrd.in{path}
        </span>
      </div>
      <div className="bg-white px-5 pb-10 pt-6 sm:px-10" style={{ "--brand": brand } as React.CSSProperties}>
        <div className="mb-8 flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] text-sm font-bold text-white" style={{ background: brand }}>{state.org.name.charAt(0)}</span>
          {state.org.name}
        </div>

        {!job && (
          <>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{state.org.tagline}</h2>
            <p className="mt-3 max-w-xl text-muted">{state.org.about}</p>
            <h3 className="mb-3 mt-10 text-sm font-semibold">{live.length} open role{live.length === 1 ? "" : "s"}</h3>
            {live.length === 0 ? (
              <p className="rounded-card border border-dashed border-line px-6 py-10 text-center text-sm text-muted">No open roles right now. Publish a job to see it here.</p>
            ) : (
              <ul className="divide-y divide-line rounded-card border border-line">
                {live.map((j) => (
                  <li key={j.id}>
                    <button type="button" onClick={() => go({ name: "career", jobId: j.id })} className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-wash/60">
                      <span>
                        <span className="block font-medium">{j.title}</span>
                        <span className="block text-[13px] text-muted">{j.department} · {j.location} · {j.workplace}</span>
                      </span>
                      <ArrowRight size={16} className="text-subtle transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {job && !apply && (
          <article>
            <button type="button" onClick={() => go({ name: "career" })} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft size={14} /> All roles</button>
            <h2 className="text-3xl font-semibold tracking-tight">{job.title}</h2>
            <p className="mt-2 text-sm text-muted">{job.department} · {job.location} · {job.workplace}{job.experienceMin != null ? ` · ${job.experienceMin}–${job.experienceMax} years` : ""}</p>
            <button type="button" onClick={() => go({ name: "career", jobId: job.id, apply: true })} className="mt-5 inline-flex h-11 items-center rounded-control bg-brand px-6 text-sm font-medium text-white hover:opacity-85">Apply for this role</button>
            <p className="mt-8 max-w-2xl border-t border-line pt-6 text-[15px] leading-7">{job.description}</p>
            {job.requiredSkills.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-1.5">
                {job.requiredSkills.map((s) => <span key={s} className="rounded-full bg-wash px-3 py-1 text-[13px]">{s}</span>)}
              </div>
            )}
          </article>
        )}

        {job && apply && (
          <div className="max-w-xl">
            <button type="button" onClick={() => go({ name: "career", jobId: job.id })} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft size={14} /> {job.title}</button>
            {submitted ? (
              <div className="rounded-card border border-line px-6 py-10 text-center">
                <CheckCircle2 className="mx-auto" size={30} strokeWidth={1.5} style={{ color: brand }} />
                <h2 className="mt-3 text-xl font-semibold">Application received</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Thanks, {submitted}. Your resume has already been scored, and HR will see you in the pipeline.</p>
                <button type="button" onClick={() => go({ name: "pipeline", jobId: job.id })} className="mt-5 text-sm font-medium underline underline-offset-4">Switch to the HR view</button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">Apply for {job.title}</h2>
                <p className="text-sm text-muted">Try applying as a candidate. Edit the resume to see how the score changes.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></Field>
                  <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></Field>
                </div>
                <Field label="Years of experience"><Input type="number" min={0} max={50} value={form.years} onChange={(e) => setForm({ ...form, years: e.target.value })} /></Field>
                <Field label="Resume" hint="In the real product, candidates upload a PDF or DOCX file."><Textarea rows={5} value={form.resume} onChange={(e) => setForm({ ...form, resume: e.target.value })} /></Field>
                {error && <p role="alert" className="rounded-control bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
                <button type="button" onClick={submit} className="inline-flex h-11 items-center rounded-control bg-brand px-6 text-sm font-medium text-white hover:opacity-85">Submit application</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
