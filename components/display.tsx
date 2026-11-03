import type { ReactNode } from "react";
import type { ApplicationStatus, JobStatus } from "@/lib/types";
import { cx } from "./classes";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-card border border-line bg-white", className)}>{children}</div>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <div className="mt-1 text-sm text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const tones = {
  neutral: "bg-wash text-muted",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-sky-50 text-sky-700",
  red: "bg-red-50 text-red-700",
  ink: "bg-ink text-white",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={cx("inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  if (status === "published") return <Badge tone="green">Live</Badge>;
  if (status === "closed") return <Badge>Closed</Badge>;
  return <Badge tone="amber">Draft</Badge>;
}

const applicationLabels: Record<ApplicationStatus, { label: string; tone: keyof typeof tones }> = {
  new: { label: "Applied", tone: "neutral" },
  shortlisted: { label: "Shortlisted", tone: "green" },
  not_shortlisted: { label: "Below threshold", tone: "neutral" },
  in_rounds: { label: "In rounds", tone: "blue" },
  hired: { label: "Hired", tone: "ink" },
  rejected: { label: "Rejected", tone: "red" },
};

export function ApplicationBadge({ status }: { status: ApplicationStatus }) {
  const { label, tone } = applicationLabels[status];
  return <Badge tone={tone}>{label}</Badge>;
}

/** Score with its threshold in mind: ink when it clears the bar, muted when it doesn't. */
export function ScorePill({ score, threshold, status }: { score: number | null; threshold?: number; status?: string }) {
  if (status === "failed") return <Badge tone="amber">Review</Badge>;
  if (score == null) return <span className="text-xs text-subtle">Scoring…</span>;
  const passes = threshold == null || score >= threshold;
  return (
    <span
      className={cx(
        "inline-flex h-6 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums",
        passes ? "bg-ink text-white" : "bg-wash text-muted",
      )}
    >
      {score}
    </span>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line px-6 py-14 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function formatDate(value: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function daysLeft(closesAt: Date | null) {
  if (!closesAt) return null;
  return Math.ceil((new Date(closesAt).getTime() - Date.now()) / 86_400_000);
}

export const WORKPLACE_LABELS = { onsite: "On-site", hybrid: "Hybrid", remote: "Remote" } as const;
export const EMPLOYMENT_LABELS = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
} as const;
export const ROUND_LABELS = { screening: "Screening", assessment: "Assessment", interview: "Interview", final: "Final" } as const;
