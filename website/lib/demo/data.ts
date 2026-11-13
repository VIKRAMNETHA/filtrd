import { scoreResume } from "./scoring";
import type { Candidate, DemoState, Job } from "./types";

export const AI_ENGINEER: Job = {
  id: "job-ai",
  title: "AI Engineer",
  department: "Engineering",
  location: "Hyderabad",
  workplace: "Hybrid",
  description:
    "Build production LLM systems and retrieval pipelines that help our warehouse robots understand instructions. You will own model evaluation, inference optimization and shipping ML features with Python and PyTorch.",
  requiredSkills: ["Python", "PyTorch", "LLM", "RAG"],
  niceSkills: ["Kubernetes", "LangChain"],
  experienceMin: 3,
  experienceMax: 6,
  threshold: 60,
  activeDays: 14,
  rounds: ["HR screening", "Technical interview", "Final interview"],
  status: "draft",
  publishedDay: null,
  closesDay: null,
  shortlistSent: false,
};

const DESIGNER: Job = {
  id: "job-design",
  title: "Product Designer",
  department: "Design",
  location: "Bengaluru",
  workplace: "Remote",
  description:
    "Design the interfaces our operators use to manage robot fleets. Own user research, prototyping and our design system, working closely with engineering.",
  requiredSkills: ["Figma", "Prototyping", "Design systems", "User research"],
  niceSkills: ["Motion design"],
  experienceMin: 2,
  experienceMax: 5,
  threshold: 70,
  activeDays: 30,
  rounds: ["Portfolio review", "Design challenge", "Final interview"],
  status: "published",
  publishedDay: -6,
  closesDay: 24,
  shortlistSent: false,
};

type Applicant = DemoState["queue"][number];

// Sample people. Names and details are invented for the demo.
export const AI_APPLICANTS: Applicant[] = [
  { id: "c1", jobId: "job-ai", name: "Asha Rao", email: "asha.rao@example.com", location: "Hyderabad", years: 5, headline: "ML engineer, LLM platforms",
    resume: "AI engineer with 5 years building production LLM systems and retrieval pipelines. Python, PyTorch, RAG, LangChain, vector search, Kubernetes, model evaluation and inference optimization. Shipped ML features to production at scale." },
  { id: "c2", jobId: "job-ai", name: "Rahul Mehta", email: "rahul.mehta@example.com", location: "Pune", years: 4, headline: "Applied scientist, NLP",
    resume: "Applied scientist working on NLP and LLM fine-tuning in Python and PyTorch. Built evaluation harnesses and RAG prototypes. Some Kubernetes for model serving." },
  { id: "c3", jobId: "job-ai", name: "Meera Iyer", email: "meera.iyer@example.com", location: "Chennai", years: 3, headline: "Backend engineer moving into ML",
    resume: "Backend engineer in Python and Go building APIs. Recently built an internal LLM chatbot with LangChain and retrieval. Comfortable with Docker and Kubernetes." },
  { id: "c4", jobId: "job-ai", name: "Daniel Thomas", email: "daniel.thomas@example.com", location: "Hyderabad", years: 7, headline: "Senior ML engineer, computer vision",
    resume: "Senior machine learning engineer with 7 years in computer vision using PyTorch and Python. Production model optimization and inference on edge devices for robotics." },
  { id: "c5", jobId: "job-ai", name: "Priya Nair", email: "priya.nair@example.com", location: "Bengaluru", years: 2, headline: "Data analyst",
    resume: "Data analyst using SQL, Excel and Tableau to build dashboards for sales teams. Basic Python scripting for reports." },
  { id: "c6", jobId: "job-ai", name: "Kabir Singh", email: "kabir.singh@example.com", location: "Delhi", years: 6, headline: "LLM engineer, search",
    resume: "LLM engineer focused on search and RAG systems. Python, PyTorch, embeddings and vector search, evaluation of LLM outputs in production. Inference optimization and LangChain pipelines." },
  { id: "c7", jobId: "job-ai", name: "Sara Khan", email: "sara.khan@example.com", location: "Mumbai", years: 1, headline: "Frontend developer",
    resume: "Frontend developer building React and TypeScript web apps. Interested in AI products and completed an online course on prompt engineering." },
  { id: "c8", jobId: "job-ai", name: "Vikram Joshi", email: "vikram.joshi@example.com", location: "Hyderabad", years: 4, headline: "MLOps engineer",
    resume: "MLOps engineer running Kubernetes model serving for PyTorch models in Python. Built monitoring for LLM services and supported a RAG rollout." },
];

const DESIGN_APPLICANTS: Applicant[] = [
  { id: "d1", jobId: "job-design", name: "Ananya Gupta", email: "ananya.gupta@example.com", location: "Bengaluru", years: 4, headline: "Product designer, B2B SaaS",
    resume: "Product designer with 4 years in B2B SaaS. Figma, prototyping, design systems and user research with operators. Some motion design." },
  { id: "d2", jobId: "job-design", name: "Rohan Das", email: "rohan.das@example.com", location: "Kolkata", years: 2, headline: "Visual designer",
    resume: "Visual designer creating marketing graphics in Figma and Illustrator. Building a portfolio of app prototyping work." },
];

export function toCandidate(applicant: Applicant, job: Job, day: number): Candidate {
  return {
    ...applicant,
    appliedDay: day,
    result: scoreResume(job, applicant.resume, applicant.years),
    status: "new",
    roundIndex: -1,
    events: [
      { day, text: "Applied through the career site", actor: "Candidate" },
      { day, text: "Resume scored", actor: "Filtrd" },
    ],
  };
}

/** `seeded` starts with Acme already set up and the AI Engineer role full of applicants, for the chat homepage. */
export function initialState({ seeded = false }: { seeded?: boolean } = {}): DemoState {
  const org = {
    name: "Acme Robotics",
    slug: "acme",
    tagline: "Build the robots that build everything else",
    about: "We design autonomous warehouse robots used across three continents.",
    brand: "#2563eb",
    hrEmail: "hr@acme.example.com",
    onboarded: seeded,
  };
  const designers = DESIGN_APPLICANTS.map((a, i) => toCandidate(a, DESIGNER, -5 + i));
  if (!seeded) {
    return { day: 0, org, jobs: [AI_ENGINEER, DESIGNER], candidates: designers, emails: [], queue: AI_APPLICANTS, nextId: 100 };
  }
  const ai: Job = { ...AI_ENGINEER, status: "published", publishedDay: -10, closesDay: 4 };
  return {
    day: 0,
    org,
    jobs: [ai, DESIGNER],
    candidates: [...AI_APPLICANTS.map((a, i) => toCandidate(a, ai, -9 + i)), ...designers],
    emails: [],
    queue: [],
    nextId: 100,
  };
}

/** Skills suggested when the agent drafts a job from just a title. */
export const SKILL_HINTS: { match: RegExp; required: string[]; nice: string[]; department: string }[] = [
  { match: /backend|server|api/i, required: ["Node.js", "PostgreSQL", "APIs", "Docker"], nice: ["Kubernetes", "AWS"], department: "Engineering" },
  { match: /frontend|react|web/i, required: ["React", "TypeScript", "CSS", "Accessibility"], nice: ["Next.js", "Testing"], department: "Engineering" },
  { match: /data analyst|analytics|bi\b/i, required: ["SQL", "Python", "Dashboards", "Statistics"], nice: ["Tableau", "dbt"], department: "Analytics" },
  { match: /data scien|machine learning|ml\b|ai\b/i, required: ["Python", "PyTorch", "Statistics", "SQL"], nice: ["LLM", "MLOps"], department: "Engineering" },
  { match: /design/i, required: ["Figma", "Prototyping", "User research", "Design systems"], nice: ["Motion design"], department: "Design" },
  { match: /product manager|pm\b/i, required: ["Roadmapping", "User research", "Analytics", "Stakeholder management"], nice: ["SQL"], department: "Product" },
  { match: /sales|account exec|business development/i, required: ["B2B sales", "CRM", "Negotiation", "Pipeline management"], nice: ["SaaS"], department: "Sales" },
  { match: /devops|sre|platform|cloud/i, required: ["Kubernetes", "Terraform", "AWS", "CI/CD"], nice: ["Observability"], department: "Engineering" },
  { match: /hr|recruit|talent/i, required: ["Recruiting", "Interviewing", "ATS", "Employer branding"], nice: ["HR analytics"], department: "People" },
];
