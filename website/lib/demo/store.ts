import { toCandidate } from "./data";
import type { Candidate, DemoState, Email, Job } from "./types";

export type Action =
  | { type: "onboard"; org: Partial<DemoState["org"]> }
  | { type: "saveJob"; job: Job; publish: boolean }
  | { type: "publish"; jobId: string }
  | { type: "arrive"; count?: number }
  | { type: "apply"; jobId: string; name: string; email: string; years: number; resume: string }
  | { type: "advanceDays"; days: number }
  | { type: "sendShortlist"; jobId: string }
  | { type: "close"; jobId: string }
  | { type: "shortlist"; candidateId: string }
  | { type: "advance"; candidateId: string }
  | { type: "reject"; candidateId: string }
  | { type: "hire"; candidateId: string }
  | { type: "note"; candidateId: string; text: string }
  | { type: "reset"; state: DemoState };

const HR = "Priya (HR)";

function updateCandidate(state: DemoState, id: string, fn: (c: Candidate, job: Job) => Candidate | null): DemoState {
  const candidate = state.candidates.find((c) => c.id === id);
  const job = candidate && state.jobs.find((j) => j.id === candidate.jobId);
  if (!candidate || !job) return state;
  const next = fn(candidate, job);
  if (!next) return state;
  return { ...state, candidates: state.candidates.map((c) => (c.id === id ? next : c)) };
}

function shortlistEmail(state: DemoState, job: Job, candidates: Candidate[], final: boolean): Email {
  const shortlisted = candidates.filter((c) => c.status === "shortlisted" || (c.status === "new" && c.result.score >= job.threshold));
  return {
    id: `e${state.nextId}`,
    day: state.day,
    kind: "shortlist",
    to: state.org.hrEmail,
    subject: `${shortlisted.length} shortlisted for ${job.title}`,
    jobId: job.id,
    candidateIds: shortlisted.sort((a, b) => b.result.score - a.result.score).map((c) => c.id),
    body: final
      ? `Applications for ${job.title} have closed. ${candidates.length} applied and ${shortlisted.length} scored ${job.threshold} or above.`
      : `Here is the shortlist so far for ${job.title}. The role is still accepting applications.`,
    final,
  };
}

/** Applies the threshold to everyone still "Applied" and emails HR, as the product does at close. */
function closeOut(state: DemoState, jobId: string, final: boolean): DemoState {
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job) return state;
  const candidates = state.candidates.map((c) => {
    if (c.jobId !== jobId || c.status !== "new") return c;
    const passes = c.result.score >= job.threshold;
    return {
      ...c,
      status: passes ? ("shortlisted" as const) : ("not_shortlisted" as const),
      events: [...c.events, { day: state.day, text: passes ? `Shortlisted: met the threshold of ${job.threshold}` : `Below the threshold of ${job.threshold}`, actor: "Filtrd" }],
    };
  });
  const email = shortlistEmail({ ...state, candidates }, job, candidates.filter((c) => c.jobId === jobId), final);
  return {
    ...state,
    candidates,
    emails: [email, ...state.emails],
    nextId: state.nextId + 1,
    jobs: state.jobs.map((j) => (j.id === jobId && final ? { ...j, status: "closed", shortlistSent: true } : j)),
  };
}

export function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "reset":
      return action.state;

    case "onboard":
      return { ...state, org: { ...state.org, ...action.org, onboarded: true } };

    case "saveJob": {
      const exists = state.jobs.some((j) => j.id === action.job.id);
      const job: Job = action.publish
        ? { ...action.job, status: "published", publishedDay: state.day, closesDay: state.day + action.job.activeDays }
        : action.job;
      return { ...state, jobs: exists ? state.jobs.map((j) => (j.id === job.id ? job : j)) : [job, ...state.jobs] };
    }

    case "publish":
      return {
        ...state,
        jobs: state.jobs.map((j) =>
          j.id === action.jobId && j.status === "draft" ? { ...j, status: "published", publishedDay: state.day, closesDay: state.day + j.activeDays } : j,
        ),
      };

    case "arrive": {
      // Only applicants for live roles arrive; the rest wait until their role is published.
      const isLive = (jobId: string) => state.jobs.some((j) => j.id === jobId && j.status === "published");
      const released = state.queue.filter((a) => isLive(a.jobId)).slice(0, action.count ?? 1);
      const fresh = released.map((a) => toCandidate(a, state.jobs.find((j) => j.id === a.jobId)!, state.day));
      return { ...state, queue: state.queue.filter((a) => !released.includes(a)), candidates: [...state.candidates, ...fresh] };
    }

    case "apply": {
      const job = state.jobs.find((j) => j.id === action.jobId);
      if (!job || job.status !== "published") return state;
      const candidate = toCandidate(
        { id: `c${state.nextId}`, jobId: job.id, name: action.name, email: action.email, location: "—", years: action.years, headline: "Applied in the demo", resume: action.resume },
        job,
        state.day,
      );
      return { ...state, candidates: [...state.candidates, candidate], nextId: state.nextId + 1 };
    }

    case "advanceDays": {
      let next: DemoState = { ...state, day: state.day + action.days };
      for (const job of next.jobs) {
        if (job.status === "published" && job.closesDay != null && job.closesDay <= next.day) next = closeOut(next, job.id, true);
      }
      return next;
    }

    case "sendShortlist":
      return closeOut(state, action.jobId, false);

    case "close": {
      const job = state.jobs.find((j) => j.id === action.jobId);
      return job?.status === "published" ? closeOut(state, action.jobId, true) : state;
    }

    case "shortlist":
      return updateCandidate(state, action.candidateId, (c) =>
        ["new", "not_shortlisted", "rejected"].includes(c.status)
          ? { ...c, status: "shortlisted", roundIndex: -1, events: [...c.events, { day: state.day, text: "Shortlisted manually", actor: HR }] }
          : null,
      );

    case "advance":
      return updateCandidate(state, action.candidateId, (c, job) => {
        if (c.status !== "shortlisted" && c.status !== "in_rounds") return null;
        const next = c.roundIndex + 1;
        if (next >= job.rounds.length) return null;
        return { ...c, status: "in_rounds", roundIndex: next, events: [...c.events, { day: state.day, text: `Moved to ${job.rounds[next]}`, actor: HR }] };
      });

    case "reject":
      return updateCandidate(state, action.candidateId, (c) =>
        c.status === "hired" || c.status === "rejected" ? null : { ...c, status: "rejected", events: [...c.events, { day: state.day, text: "Rejected", actor: HR }] },
      );

    case "hire":
      return updateCandidate(state, action.candidateId, (c) =>
        c.status !== "in_rounds" ? null : { ...c, status: "hired", events: [...c.events, { day: state.day, text: "Marked as hired", actor: HR }] },
      );

    case "note":
      return updateCandidate(state, action.candidateId, (c) => ({ ...c, events: [...c.events, { day: state.day, text: action.text, actor: HR }] }));
  }
}

export function daysLeft(job: Job, day: number) {
  return job.closesDay == null ? null : Math.max(job.closesDay - day, 0);
}
