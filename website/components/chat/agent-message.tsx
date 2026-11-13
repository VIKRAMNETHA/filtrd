"use client";

import { ArrowRight, Check } from "lucide-react";
import { daysLeft } from "@/lib/demo/store";
import { useDemo, type Message } from "../demo/context";
import { JobBadge } from "../demo/hr-screens";
import { WaitlistForm } from "../site/waitlist-form";
import { ScorePill, cx } from "../ui";

const SCREEN_LABEL: Record<string, string> = {
  dashboard: "overview",
  jobs: "jobs",
  pipeline: "pipeline",
  candidate: "candidate",
  emails: "emails",
  career: "career site",
};

/** One agent turn: the steps it took, its answer, and any candidates, roles or forms it brought back. */
export function AgentMessage({ message: m, isLast, compact = false }: { message: Message; isLast: boolean; compact?: boolean }) {
  const { state, go, ask, typing } = useDemo();
  return (
    <div className="space-y-3">
      {m.steps && m.steps.length > 0 && (
        <ul className="space-y-1">
          {m.steps.map((s) => (
            <li key={s} className="flex items-center gap-1.5 text-xs text-muted"><Check size={12} className="text-emerald-600" /> {s}</li>
          ))}
        </ul>
      )}
      <p className={cx("leading-relaxed", compact ? "rounded-[18px] rounded-bl-md bg-wash px-3.5 py-2.5 text-sm" : "text-[15px]")}>{m.text}</p>

      {m.candidateIds && m.candidateIds.length > 0 && (
        <div className={cx("grid gap-1.5", !compact && "sm:grid-cols-2")}>
          {m.candidateIds.map((id) => {
            const c = state.candidates.find((x) => x.id === id);
            const job = c && state.jobs.find((j) => j.id === c.jobId);
            if (!c || !job) return null;
            return (
              <button key={id} type="button" onClick={() => go({ name: "candidate", candidateId: id })} className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-line bg-white px-3.5 py-2.5 text-left transition-colors hover:border-subtle">
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium">{c.name}</span>
                  <span className="block truncate text-xs text-muted">{c.headline}</span>
                </span>
                <ScorePill score={c.result.score} threshold={job.threshold} />
              </button>
            );
          })}
        </div>
      )}

      {m.jobIds && m.jobIds.length > 0 && (
        <div className={cx("grid gap-1.5", !compact && "sm:grid-cols-2")}>
          {m.jobIds.map((id) => {
            const job = state.jobs.find((j) => j.id === id);
            if (!job) return null;
            const applied = state.candidates.filter((c) => c.jobId === id).length;
            const left = daysLeft(job, state.day);
            return (
              <button key={id} type="button" onClick={() => go({ name: "pipeline", jobId: id })} className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-line bg-white px-3.5 py-2.5 text-left transition-colors hover:border-subtle">
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium">{job.title}</span>
                  <span className="block truncate text-xs text-muted">{applied} applied · {job.threshold}+{job.status === "published" && left != null ? ` · ${left} days left` : ""}</span>
                </span>
                <JobBadge job={job} />
              </button>
            );
          })}
        </div>
      )}

      {m.widget === "waitlist" && <WaitlistForm />}

      {m.open && !compact && (
        <button type="button" onClick={() => go(m.open!)} className="inline-flex items-center gap-1 text-[13px] font-medium text-ink underline-offset-4 hover:underline">
          Open {SCREEN_LABEL[m.open.name] ?? "workspace"} <ArrowRight size={13} />
        </button>
      )}

      {m.suggestions && m.suggestions.length > 0 && isLast && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {m.suggestions.map((s) => (
            <button key={s} type="button" disabled={typing} onClick={() => ask(s)} className="rounded-full border border-line bg-white px-3 py-1.5 text-left text-xs transition-colors hover:bg-wash disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
