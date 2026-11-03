"use client";

import { useActionState, useState } from "react";
import { updateOrgAction } from "@/app/_actions/org";
import type { FormState, Org, OrgSettings } from "@/lib/types";
import { RoundsEditor } from "./rounds-editor";
import { TagInput } from "./tag-input";
import { Field, FormError, Input, SubmitButton, Textarea } from "./ui";

export function SettingsForm({ org, settings }: { org: Org; settings: OrgSettings }) {
  const [state, action] = useActionState<FormState, FormData>(updateOrgAction, {});
  const [data, setData] = useState({
    name: org.name,
    website: org.website ?? "",
    industry: org.industry ?? "",
    companySize: org.companySize ?? "",
    headquarters: org.headquarters ?? "",
    tagline: org.tagline ?? "",
    about: org.about ?? "",
    brandColor: org.brandColor,
    hrEmail: settings.hrEmail,
    defaultThreshold: settings.defaultThreshold,
    defaultActiveDays: settings.defaultActiveDays,
    departments: settings.departments,
    defaultRounds: settings.defaultRounds,
  });
  const set = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) => setData((d) => ({ ...d, [key]: value }));

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(data)} />
      <section className="space-y-5 rounded-card border border-line p-6">
        <h2 className="text-sm font-semibold">Organization and career site</h2>
        <Field label="Name"><Input value={data.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Website"><Input type="url" value={data.website} onChange={(e) => set("website", e.target.value)} /></Field>
          <Field label="Headquarters"><Input value={data.headquarters} onChange={(e) => set("headquarters", e.target.value)} /></Field>
        </div>
        <Field label="Tagline"><Input value={data.tagline} maxLength={160} onChange={(e) => set("tagline", e.target.value)} /></Field>
        <Field label="About"><Textarea rows={4} value={data.about} onChange={(e) => set("about", e.target.value)} /></Field>
        <Field label="Brand colour">
          <input type="color" value={data.brandColor} onChange={(e) => set("brandColor", e.target.value)} className="h-9 w-14 cursor-pointer rounded-lg border border-line bg-white p-0.5" />
        </Field>
      </section>
      <section className="space-y-5 rounded-card border border-line p-6">
        <h2 className="text-sm font-semibold">Hiring defaults</h2>
        <Field label="HR email"><Input type="email" value={data.hrEmail} onChange={(e) => set("hrEmail", e.target.value)} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Shortlist score"><Input type="number" min={0} max={100} value={data.defaultThreshold} onChange={(e) => set("defaultThreshold", Number(e.target.value))} /></Field>
          <Field label="Days a role stays open"><Input type="number" min={1} max={365} value={data.defaultActiveDays} onChange={(e) => set("defaultActiveDays", Number(e.target.value))} /></Field>
        </div>
        <div>
          <span className="mb-1.5 block text-[13px] font-medium">Departments</span>
          <TagInput label="Departments" value={data.departments} onChange={(v) => set("departments", v)} />
        </div>
        <div>
          <span className="mb-2 block text-[13px] font-medium">Hiring rounds</span>
          <RoundsEditor rounds={data.defaultRounds} onChange={(v) => set("defaultRounds", v)} />
        </div>
      </section>
      <FormError message={state.error} />
      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
        {state.ok && <span role="status" className="text-sm text-muted">{state.message}</span>}
      </div>
    </form>
  );
}
