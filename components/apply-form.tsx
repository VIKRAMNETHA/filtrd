"use client";

import { CheckCircle2, FileText, Upload } from "lucide-react";
import { useActionState, useState } from "react";
import { applyAction } from "@/app/_actions/apply";
import type { FormState } from "@/lib/types";
import { Field, FormError, Input, SubmitButton, Textarea } from "./ui";

export function ApplyForm({ slug, jobId, jobTitle, orgName, backHref }: { slug: string; jobId: string; jobTitle: string; orgName: string; backHref: string }) {
  const [state, action] = useActionState<FormState, FormData>(applyAction.bind(null, slug, jobId), {});
  const [fileName, setFileName] = useState<string>();

  if (state.ok) {
    return (
      <div className="rounded-card border border-line px-6 py-14 text-center">
        <CheckCircle2 className="mx-auto text-brand" size={32} strokeWidth={1.5} />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Application received</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Thanks for applying for {jobTitle} at {orgName}. We&apos;ve sent you a confirmation by email and will be in touch about next steps.
        </p>
        <a href={backHref} className="mt-6 inline-block text-sm font-medium underline underline-offset-4">See other roles</a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name"><Input name="name" required autoComplete="name" /></Field>
        <Field label="Email"><Input name="email" type="email" required autoComplete="email" /></Field>
        <Field label="Phone (optional)"><Input name="phone" type="tel" autoComplete="tel" /></Field>
        <Field label="Current location (optional)"><Input name="location" /></Field>
        <Field label="Years of experience (optional)"><Input name="yearsExperience" type="number" min={0} max={60} step={0.5} /></Field>
        <Field label="LinkedIn (optional)"><Input name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/…" /></Field>
      </div>

      <div>
        <span className="mb-1.5 block text-[13px] font-medium">Resume</span>
        <label className="flex cursor-pointer items-center gap-3 rounded-card border border-dashed border-line px-5 py-6 transition-colors hover:bg-wash/60 focus-within:border-ink">
          {fileName ? <FileText size={20} className="shrink-0" strokeWidth={1.5} /> : <Upload size={20} className="shrink-0 text-muted" strokeWidth={1.5} />}
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{fileName ?? "Upload your resume"}</span>
            <span className="block text-xs text-muted">{fileName ? "Choose a different file" : "PDF or DOCX, up to 5 MB"}</span>
          </span>
          <input
            type="file"
            name="resume"
            required
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name)}
          />
        </label>
      </div>

      <Field label="Anything you'd like to add? (optional)"><Textarea name="coverNote" rows={4} maxLength={4000} /></Field>

      {/* Hidden from people; bots tend to fill it in. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted">
        <input type="checkbox" name="consent" required className="mt-1 accent-ink" />
        <span>I agree that {orgName} may process my application, including automated scoring of my resume to help its team prioritise review. People at {orgName} make hiring decisions.</span>
      </label>

      <FormError message={state.error} />
      <SubmitButton className="!h-11 w-full !bg-brand sm:w-auto sm:!px-8" pendingText="Submitting…">Submit application</SubmitButton>
    </form>
  );
}
