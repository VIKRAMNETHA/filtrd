"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "../ui";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; message: string };

export function WaitlistForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  if (status.kind === "done") {
    return (
      <div className="rounded-card border border-line bg-white px-6 py-12 text-center">
        <CheckCircle2 className="mx-auto" size={30} strokeWidth={1.5} />
        <h3 className="mt-3 text-lg font-semibold">You&apos;re on the list</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">Thanks for your interest in Filtrd. We&apos;ll be in touch about joining the pilot.</p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-card border border-line bg-white p-5 sm:p-7"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        setStatus({ kind: "sending" });
        try {
          const res = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          if (!res.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
          setStatus({ kind: "done" });
        } catch (error) {
          setStatus({ kind: "error", message: error instanceof Error && error.message !== "Failed to fetch" ? error.message : "We couldn't reach the server. Please try again." });
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name"><Input name="name" required maxLength={100} autoComplete="name" /></Field>
        <Field label="Work email"><Input name="email" type="email" required maxLength={200} autoComplete="email" /></Field>
        <Field label="Company"><Input name="company" required maxLength={120} autoComplete="organization" /></Field>
        <Field label="Company size">
          <Select name="size" defaultValue="11-50">
            <option value="1-10">1–10</option>
            <option value="11-50">11–50</option>
            <option value="51-200">51–200</option>
            <option value="201-1000">201–1,000</option>
            <option value="1000+">1,000+</option>
          </Select>
        </Field>
      </div>
      <Field label="What are you hiring for? (optional)"><Textarea name="message" rows={3} maxLength={1000} /></Field>
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {status.kind === "error" && <p role="alert" className="rounded-control bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{status.message}</p>}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={status.kind === "sending"}>
        {status.kind === "sending" ? "Sending…" : "Request pilot access"}
      </Button>
      <p className="text-xs text-muted">We&apos;ll only use your details to contact you about Filtrd.</p>
    </form>
  );
}
