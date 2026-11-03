"use client";

import { Check } from "lucide-react";
import { useActionState, useState } from "react";
import { completeOnboardingAction } from "@/app/_actions/org";
import type { FormState, RoundInput } from "@/lib/types";
import { RoundsEditor } from "./rounds-editor";
import { TagInput } from "./tag-input";
import { Button, Field, FormError, Input, Select, SubmitButton, Textarea } from "./ui";

const STEPS = ["Organization", "Career site", "Hiring defaults", "Review"];
const INDUSTRIES = ["Technology", "Financial services", "Healthcare", "Education", "Manufacturing", "Retail", "Consulting", "Media", "Non-profit", "Other"];
const SIZES = ["1–10", "11–50", "51–200", "201–1,000", "1,001–5,000", "5,000+"];
const SWATCHES = ["#111111", "#2563eb", "#0f766e", "#7c3aed", "#be123c", "#c2410c"];

const toSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");

export function OnboardingWizard({ userEmail, rootDomain }: { userEmail: string; rootDomain: string }) {
  const [state, action] = useActionState<FormState, FormData>(completeOnboardingAction, {});
  const [step, setStep] = useState(0);
  const [slugEdited, setSlugEdited] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const [data, setData] = useState({
    name: "",
    website: "",
    industry: "",
    companySize: "",
    headquarters: "",
    slug: "",
    tagline: "",
    about: "",
    brandColor: "#111111",
    hrEmail: userEmail,
    defaultThreshold: 70,
    defaultActiveDays: 30,
    departments: ["Engineering", "Product", "Design", "Operations"],
    defaultRounds: [
      { name: "HR screening", kind: "screening" },
      { name: "Technical interview", kind: "interview" },
      { name: "Final interview", kind: "final" },
    ] as RoundInput[],
  });
  const set = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) => setData((d) => ({ ...d, [key]: value }));

  const validate = () => {
    if (step === 0 && data.name.trim().length < 2) return "Please enter your organization's name.";
    if (step === 1 && !/^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/.test(data.slug)) return "Your career site address can use lowercase letters, numbers and hyphens.";
    if (step === 2 && !/^\S+@\S+\.\S+$/.test(data.hrEmail)) return "Please enter a valid HR email.";
    if (step === 2 && data.defaultRounds.some((r) => !r.name.trim())) return "Every round needs a name.";
    return undefined;
  };
  const next = () => {
    const error = validate();
    setLocalError(error);
    if (!error) setStep((s) => s + 1);
  };

  return (
    <div>
      <ol className="mb-10 flex items-center gap-2">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 flex-col gap-2">
            <span className={`h-1 rounded-full ${index <= step ? "bg-ink" : "bg-line"}`} />
            <span className={`hidden text-xs sm:block ${index === step ? "font-medium text-ink" : "text-subtle"}`}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="space-y-5">
          <Heading title="Tell us about your organization" body="This appears on your career site and in emails to candidates." />
          <Field label="Organization name">
            <Input
              autoFocus
              value={data.name}
              placeholder="Acme Technologies"
              onChange={(e) => {
                const name = e.target.value;
                setData((d) => ({ ...d, name, slug: slugEdited ? d.slug : toSlug(name) }));
              }}
            />
          </Field>
          <Field label="Website">
            <Input type="url" value={data.website} placeholder="https://acme.com" onChange={(e) => set("website", e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Industry">
              <Select value={data.industry} onChange={(e) => set("industry", e.target.value)}>
                <option value="">Select</option>
                {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
              </Select>
            </Field>
            <Field label="Company size">
              <Select value={data.companySize} onChange={(e) => set("companySize", e.target.value)}>
                <option value="">Select</option>
                {SIZES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Headquarters">
            <Input value={data.headquarters} placeholder="Hyderabad, India" onChange={(e) => set("headquarters", e.target.value)} />
          </Field>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-5">
          <Heading title="Set up your career site" body="Candidates will find your open roles here." />
          <Field label="Career site address" hint="Lowercase letters, numbers and hyphens.">
            <div className="flex items-center rounded-control border border-line focus-within:border-ink">
              <input
                aria-label="Career site subdomain"
                className="h-10 min-w-0 flex-1 rounded-l-control bg-transparent pl-3.5 text-sm focus:outline-none"
                value={data.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40));
                }}
              />
              <span className="shrink-0 pr-3.5 text-sm text-muted">.{rootDomain}</span>
            </div>
          </Field>
          <Field label="Tagline">
            <Input value={data.tagline} maxLength={160} placeholder="Build the future of logistics with us" onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label="About the company">
            <Textarea rows={4} value={data.about} placeholder="What you do, and what it's like to work here." onChange={(e) => set("about", e.target.value)} />
          </Field>
          <div>
            <span className="mb-2 block text-[13px] font-medium">Brand colour</span>
            <div className="flex items-center gap-2">
              {SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Use ${color}`}
                  aria-pressed={data.brandColor === color}
                  onClick={() => set("brandColor", color)}
                  className="grid h-8 w-8 place-items-center rounded-full"
                  style={{ background: color }}
                >
                  {data.brandColor === color && <Check size={14} color="#fff" />}
                </button>
              ))}
              <input type="color" aria-label="Custom colour" value={data.brandColor} onChange={(e) => set("brandColor", e.target.value)} className="ml-1 h-8 w-10 cursor-pointer rounded-lg border border-line bg-white p-0.5" />
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5">
          <Heading title="Set your hiring defaults" body="New roles start with these. You can change them for any role." />
          <Field label="HR email" hint="Shortlist reports are sent here unless a role names someone else.">
            <Input type="email" value={data.hrEmail} onChange={(e) => set("hrEmail", e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={`Shortlist score: ${data.defaultThreshold}`} hint="Resumes at or above this score are shortlisted.">
              <input type="range" min={0} max={100} step={5} className="mt-2 w-full" value={data.defaultThreshold} onChange={(e) => set("defaultThreshold", Number(e.target.value))} />
            </Field>
            <Field label="Days a role stays open">
              <Input type="number" min={1} max={365} value={data.defaultActiveDays} onChange={(e) => set("defaultActiveDays", Number(e.target.value))} />
            </Field>
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium">Departments</span>
            <TagInput label="Departments" value={data.departments} onChange={(v) => set("departments", v)} placeholder="Type and press Enter" />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">Hiring rounds</span>
            <RoundsEditor rounds={data.defaultRounds} onChange={(v) => set("defaultRounds", v)} />
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <Heading title="Ready to go" body="You can change all of this later in Settings." />
          <dl className="divide-y divide-line rounded-card border border-line text-sm">
            {[
              ["Organization", data.name],
              ["Career site", `${data.slug}.${rootDomain}`],
              ["HR email", data.hrEmail],
              ["Shortlist score", String(data.defaultThreshold)],
              ["Roles stay open", `${data.defaultActiveDays} days`],
              ["Rounds", data.defaultRounds.map((r) => r.name).join(" → ") || "None"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-6 px-5 py-3.5">
                <dt className="shrink-0 text-muted">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="mt-5 empty:hidden">
        <FormError message={localError ?? state.error} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button> : <span />}
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>Continue</Button>
        ) : (
          <form action={action}>
            <input type="hidden" name="payload" value={JSON.stringify(data)} />
            <SubmitButton pendingText="Creating your workspace…">Create workspace</SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}

function Heading({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
