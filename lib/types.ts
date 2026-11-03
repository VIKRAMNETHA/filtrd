export type Org = {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  headquarters: string | null;
  tagline: string | null;
  about: string | null;
  brandColor: string;
};

export type RoundKind = "screening" | "assessment" | "interview" | "final";
export type RoundInput = { name: string; kind: RoundKind };

export type OrgSettings = {
  orgId: string;
  hrEmail: string;
  defaultThreshold: number;
  defaultActiveDays: number;
  defaultRounds: RoundInput[];
  departments: string[];
};

export type JobStatus = "draft" | "published" | "closed";

export type Job = {
  id: string;
  orgId: string;
  title: string;
  department: string | null;
  location: string | null;
  workplace: "onsite" | "hybrid" | "remote";
  employmentType: "full_time" | "part_time" | "contract" | "internship";
  experienceMin: number | null;
  experienceMax: number | null;
  salaryRange: string | null;
  description: string;
  requiredSkills: string[];
  niceSkills: string[];
  threshold: number;
  activeDays: number;
  notifyEmails: string[];
  status: JobStatus;
  publishedAt: Date | null;
  closesAt: Date | null;
  shortlistSentAt: Date | null;
  createdAt: Date;
};

export type Round = { id: string; orgId: string; jobId: string; position: number; name: string; kind: RoundKind };

export type ApplicationStatus = "new" | "shortlisted" | "not_shortlisted" | "in_rounds" | "hired" | "rejected";

export type ScoreDetails = {
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  breakdown: { label: string; points: number; max: number }[];
};

export type Application = {
  id: string;
  orgId: string;
  jobId: string;
  name: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  location: string | null;
  yearsExperience: string | null;
  coverNote: string | null;
  status: ApplicationStatus;
  currentRoundId: string | null;
  score: number | null;
  scoreStatus: "pending" | "done" | "failed";
  scoreMethod: string | null;
  scoreDetails: ScoreDetails | null;
  resumeText: string | null;
  createdAt: Date;
};

export type EmailRow = {
  id: string;
  kind: string;
  toAddrs: string[];
  subject: string;
  html: string;
  status: "queued" | "sent" | "captured" | "failed";
  error: string | null;
  createdAt: Date;
  sentAt: Date | null;
};

export type FormState = { error?: string; ok?: boolean; message?: string };
