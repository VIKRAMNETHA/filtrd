import type { ScoreResult } from "./scoring";

export type JobStatus = "draft" | "published" | "closed";
export type CandidateStatus = "new" | "shortlisted" | "not_shortlisted" | "in_rounds" | "hired" | "rejected";

export type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  workplace: "On-site" | "Hybrid" | "Remote";
  description: string;
  requiredSkills: string[];
  niceSkills: string[];
  experienceMin: number | null;
  experienceMax: number | null;
  threshold: number;
  activeDays: number;
  rounds: string[];
  status: JobStatus;
  publishedDay: number | null;
  closesDay: number | null;
  shortlistSent: boolean;
};

export type TimelineEvent = { day: number; text: string; actor: string };

export type Candidate = {
  id: string;
  jobId: string;
  name: string;
  email: string;
  location: string;
  years: number;
  headline: string;
  resume: string;
  appliedDay: number;
  result: ScoreResult;
  status: CandidateStatus;
  roundIndex: number;
  events: TimelineEvent[];
};

export type Email = {
  id: string;
  day: number;
  kind: "shortlist" | "candidate";
  to: string;
  subject: string;
  jobId: string;
  candidateIds: string[];
  body: string;
  final: boolean;
};

export type Org = {
  name: string;
  slug: string;
  tagline: string;
  about: string;
  brand: string;
  hrEmail: string;
  onboarded: boolean;
};

export type DemoState = {
  day: number;
  org: Org;
  jobs: Job[];
  candidates: Candidate[];
  emails: Email[];
  /** Applicants not yet "arrived"; the simulation releases them one by one. */
  queue: Omit<Candidate, "result" | "status" | "roundIndex" | "events" | "appliedDay">[];
  nextId: number;
};

export type Screen =
  | { name: "onboarding" }
  | { name: "dashboard" }
  | { name: "jobs" }
  | { name: "new-job" }
  | { name: "pipeline"; jobId: string }
  | { name: "candidate"; candidateId: string }
  | { name: "emails"; emailId?: string }
  | { name: "career"; jobId?: string; apply?: boolean };
