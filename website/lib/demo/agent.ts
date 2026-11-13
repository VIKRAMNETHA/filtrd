import { SKILL_HINTS } from "./data";
import { daysLeft, type Action } from "./store";
import type { Candidate, DemoState, Job, Screen } from "./types";

// A scripted hiring agent for the demo. It recognises common requests, acts on the demo state through
// the same actions the UI uses, and explains what it did. No model or network is involved.

export type AgentReply = {
  steps: string[];
  text: string;
  candidateIds?: string[];
  jobIds?: string[];
  actions: Action[];
  open?: Screen;
  suggestions?: string[];
  widget?: "waitlist";
};

/** Short replies that accept the agent's last suggestion. */
export const AFFIRMATIVE = /^(yes|yeah|yep|yup|sure|ok|okay|do it|go ahead|please do|please|y)\b[\s!.]*$/i;

export const STARTER_PROMPTS = [
  "Show me the shortlisted candidates for AI Engineer",
  "Post a job for a Senior Backend Engineer in Bengaluru",
  "Tell me about Asha Rao",
  "Which roles close this week?",
];

const titleCase = (s: string) =>
  s.trim().replace(/\s+/g, " ").replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\b(Ai|Ml|Ui|Ux|Hr|Qa|Sre|Bi)\b/g, (m) => m.toUpperCase());

function findCandidates(input: string, state: DemoState): Candidate[] {
  const text = ` ${input.toLowerCase().replace(/[^a-z\s]/g, " ")} `;
  const full = state.candidates.filter((c) => text.includes(` ${c.name.toLowerCase()} `));
  if (full.length) return full;
  return state.candidates.filter((c) => {
    const [first, last] = c.name.toLowerCase().split(" ");
    return text.includes(` ${first} `) || (last && text.includes(` ${last} `));
  });
}

function findJob(input: string, state: DemoState): Job | undefined {
  const text = input.toLowerCase();
  const scored = state.jobs
    .map((job) => ({ job, hits: job.title.toLowerCase().split(/\s+/).filter((w) => w.length > 1 && new RegExp(`\\b${w}\\b`).test(text)).length }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits);
  return scored[0]?.job;
}

/** When no role is named, use the one with the most activity. */
function defaultJob(state: DemoState) {
  const counts = (j: Job) => state.candidates.filter((c) => c.jobId === j.id).length;
  return [...state.jobs].filter((j) => j.status !== "draft").sort((a, b) => counts(b) - counts(a))[0] ?? state.jobs[0];
}

const STATUS_WORDS: Record<Candidate["status"], string> = {
  new: "applied, awaiting the shortlist",
  shortlisted: "shortlisted",
  not_shortlisted: "below the threshold",
  in_rounds: "in the interview rounds",
  hired: "hired",
  rejected: "rejected",
};

function describe(c: Candidate, job: Job) {
  const stage = c.status === "in_rounds" ? `in ${job.rounds[c.roundIndex]}` : STATUS_WORDS[c.status];
  return `${c.name} applied for ${job.title} and scored ${c.result.score}/100 (the shortlist score is ${job.threshold}). ${c.result.summary} They have ${c.years} years of experience and are ${stage}.`;
}

function draftJob(input: string, state: DemoState): Job {
  const forMatch = input.match(/\bfor\s+(?:an?\s+)?(.+?)(?=\s+(?:in|at|based|with|threshold|score|for|open)\b|[,.]|$)/i);
  const roleMatch = input.match(/(?:post|create|open|publish|add)\s+(?:a\s+|an\s+)?(?:new\s+)?(.+?)\s+(?:job|role|position|opening)\b/i);
  const raw = forMatch?.[1] ?? roleMatch?.[1] ?? "New Role";
  const title = titleCase(raw.replace(/\b(job|role|position|opening)\b/gi, ""));
  const location = input.match(/\bin\s+([A-Za-z][A-Za-z ]+?)(?=\s+(?:with|threshold|score|for|open)\b|[,.]|$)/i)?.[1];
  const threshold = Number(input.match(/(?:score|threshold)\D{0,12}(\d{1,3})/i)?.[1] ?? 65);
  const days = Number(input.match(/(\d{1,3})\s*days?/i)?.[1] ?? 21);
  const hint = SKILL_HINTS.find((h) => h.match.test(title)) ?? { required: ["Communication", "Problem solving"], nice: [], department: "General" };
  const remote = /remote/i.test(input);
  return {
    id: `job-${state.nextId}`,
    title,
    department: hint.department,
    location: location ? titleCase(location) : "Hyderabad",
    workplace: remote ? "Remote" : "Hybrid",
    description: `We're hiring a ${title} to join our ${hint.department.toLowerCase()} team. You'll work on real problems with a small, ambitious team and own your work from idea to production.`,
    requiredSkills: hint.required,
    niceSkills: hint.nice,
    experienceMin: /senior|lead|staff/i.test(title) ? 5 : 2,
    experienceMax: /senior|lead|staff/i.test(title) ? 10 : 6,
    threshold: Math.min(Math.max(threshold, 0), 100),
    activeDays: Math.min(Math.max(days, 1), 365),
    rounds: ["HR screening", "Technical interview", "Final interview"],
    status: "draft",
    publishedDay: null,
    closesDay: null,
    shortlistSent: false,
  };
}

export function respond(input: string, state: DemoState): AgentReply {
  const text = input.trim();
  const lower = text.toLowerCase();
  const named = findCandidates(text, state);
  const job = findJob(text, state);

  if (!text || /^(hi|hello|hey|help|what can you do)\b/.test(lower)) {
    return {
      steps: [],
      text: "Hi! I'm the Filtrd hiring agent. I can post jobs, find and compare candidates, move people through interview rounds, and send shortlists to HR. What would you like to do?",
      actions: [],
      suggestions: STARTER_PROMPTS,
    };
  }

  if (/\b(join|sign ?up|waitlist|wait list|pilot|book|contact|get started|talk to (sales|the team|someone)|early access)\b/.test(lower) && !named.length) {
    return {
      steps: [],
      text: "Happy to get you set up. Leave your details and the Filtrd team will contact you about the pilot, including a set-up call and your own career site.",
      actions: [],
      widget: "waitlist",
    };
  }

  if (/\b(price|pricing|cost|how much|plans?|free)\b/.test(lower)) {
    return {
      steps: [],
      text: "Filtrd is onboarding a small group of pilot companies, who get early access while we shape the product together. Share your details and the team will walk you through it.",
      actions: [],
      suggestions: ["Join the pilot", "What can Filtrd do?"],
    };
  }

  if (/\b(what (is|does|can) filtrd|about filtrd|how does (it|filtrd) work|features|what can (you|filtrd) do|who are you)\b/.test(lower)) {
    return {
      steps: [],
      text: "Filtrd runs your hiring from job post to offer. Each company gets a branded career site. You set a shortlist score, how many days a role stays open and the interview rounds. Every resume is scored the moment it arrives, with an explanation, and when the role closes HR gets the shortlist by email. People make every decision. I'm the hiring agent, so you can do all of it by chatting with me. This demo uses sample data from Acme Robotics.",
      actions: [],
      suggestions: ["Show me the shortlisted candidates for AI Engineer", "Show me the career site", "Join the pilot"],
    };
  }

  if (/\b(career ?site|careers page|job board|public page)\b/.test(lower)) {
    return {
      steps: ["Opened acme.filtrd.in"],
      text: `This is ${state.org.name}'s career site at ${state.org.slug}.filtrd.in. It shows only their live roles, in their brand colour, and candidates apply from here.`,
      actions: [],
      open: { name: "career" },
    };
  }

  if (/\b(inbox|emails?)\b/.test(lower) && !/\b(send|shortlist)\b/.test(lower)) {
    return {
      steps: ["Opened the email log"],
      text: state.emails.length ? `There ${state.emails.length === 1 ? "is 1 email" : `are ${state.emails.length} emails`} so far. Shortlist reports go to ${state.org.hrEmail}.` : `No emails yet. When a role closes, the shortlist goes to ${state.org.hrEmail}. Want me to close a role now?`,
      actions: [],
      open: { name: "emails" },
      suggestions: state.emails.length ? undefined : ["Close the AI Engineer role"],
    };
  }

  if (/\b(open|show|view)\b.*\b(pipeline|board|kanban)\b/.test(lower) && !named.length) {
    const target = job ?? defaultJob(state);
    return {
      steps: [`Opened the ${target.title} pipeline`],
      text: `Here's the ${target.title} pipeline. Candidates scoring ${target.threshold}+ are highlighted.`,
      actions: [],
      jobIds: [target.id],
      open: { name: "pipeline", jobId: target.id },
    };
  }

  if (/\b(roles|jobs|openings|positions)\b/.test(lower) && /\b(list|show|what|which|all|open)\b/.test(lower) && !/\bclos/.test(lower)) {
    return {
      steps: ["Listed every role"],
      text: `${state.org.name} has ${state.jobs.length} roles.`,
      actions: [],
      jobIds: state.jobs.map((j) => j.id),
      open: { name: "jobs" },
    };
  }

  // Creating a job: check before candidate actions, since "hire" can appear in both.
  if (/\b(post|create|open|publish|add|draft)\b/.test(lower) && /\b(job|role|position|opening|for an?)\b/.test(lower) && !named.length) {
    const draft = draftJob(text, state);
    return {
      steps: ["Drafted the job description", `Suggested skills for ${draft.title}`, `Set the shortlist score to ${draft.threshold}`, "Published to your career site"],
      text: `Done. ${draft.title} is live on your career site in ${draft.location}. It stays open for ${draft.activeDays} days, resumes scoring ${draft.threshold}+ get shortlisted, and it has three rounds: ${draft.rounds.join(", ")}. I suggested these skills: ${draft.requiredSkills.join(", ")}. You can edit any of it.`,
      jobIds: [draft.id],
      actions: [{ type: "saveJob", job: draft, publish: true }],
      open: { name: "pipeline", jobId: draft.id },
      suggestions: [`Show me the shortlisted candidates for ${draft.title}`, "Which roles close this week?"],
    };
  }

  if (/\bcompare\b/.test(lower)) {
    if (named.length < 2) {
      return { steps: [], text: "Tell me two candidates to compare, for example \"Compare Asha Rao and Kabir Singh\".", actions: [] };
    }
    const [a, b] = named;
    const jobA = state.jobs.find((j) => j.id === a.jobId)!;
    const better = a.result.score === b.result.score ? null : a.result.score > b.result.score ? a : b;
    const missingFor = (c: Candidate) => (c.result.missingSkills.length ? `missing ${c.result.missingSkills.join(", ")}` : "covers every required skill");
    return {
      steps: ["Read both resumes", "Compared scores and skills"],
      text: `${a.name} scored ${a.result.score} and ${missingFor(a)}, with ${a.years} years of experience. ${b.name} scored ${b.result.score} and ${missingFor(b)}, with ${b.years} years. ${better ? `${better.name} is the stronger match on paper for ${jobA.title}.` : "They're level on paper."} I'd still review both resumes before deciding.`,
      candidateIds: [a.id, b.id],
      actions: [],
    };
  }

  if (named.length) {
    const c = named[0];
    const cJob = state.jobs.find((j) => j.id === c.jobId)!;

    if (/\b(move|advance|next round|progress|schedule|push)\b/.test(lower)) {
      if (c.status !== "shortlisted" && c.status !== "in_rounds") {
        return {
          steps: [],
          text: `${c.name} is ${STATUS_WORDS[c.status]}, so they can't move to a round yet. Want me to shortlist them first?`,
          actions: [],
          suggestions: [`Shortlist ${c.name}`],
        };
      }
      const next = cJob.rounds[c.roundIndex + 1];
      if (!next) return { steps: [], text: `${c.name} has finished every round. Shall I mark them as hired?`, actions: [], suggestions: [`Hire ${c.name}`] };
      return {
        steps: [`Moved ${c.name} to ${next}`, "Emailed the candidate about the next step"],
        text: `${c.name} is now in ${next}. I let them know by email that they're moving forward.`,
        candidateIds: [c.id],
        actions: [{ type: "advance", candidateId: c.id }],
      };
    }
    if (/\b(reject|decline|turn down)\b/.test(lower)) {
      return {
        steps: [`Rejected ${c.name}`, "Sent a polite rejection email"],
        text: `${c.name} has been rejected and received a polite email. You can still shortlist them again later from their profile.`,
        candidateIds: [c.id],
        actions: [{ type: "reject", candidateId: c.id }],
      };
    }
    if (/\b(hire|offer)\b/.test(lower)) {
      if (c.status !== "in_rounds") {
        return { steps: [], text: `${c.name} needs to go through the interview rounds before being hired. They're currently ${STATUS_WORDS[c.status]}.`, actions: [] };
      }
      return { steps: [`Marked ${c.name} as hired`], text: `Congratulations, ${c.name} is marked as hired for ${cJob.title}! 🎉`, candidateIds: [c.id], actions: [{ type: "hire", candidateId: c.id }] };
    }
    if (/\bshortlist\b/.test(lower)) {
      if (!["new", "not_shortlisted", "rejected"].includes(c.status)) return { steps: [], text: `${c.name} is already ${STATUS_WORDS[c.status]}.`, actions: [] };
      return {
        steps: [`Shortlisted ${c.name}`],
        text: `${c.name} is on the shortlist for ${cJob.title}. You overrode the score of ${c.result.score}, and that's recorded on their timeline.`,
        candidateIds: [c.id],
        actions: [{ type: "shortlist", candidateId: c.id }],
      };
    }
    return {
      steps: ["Read the resume", "Checked the score breakdown"],
      text: describe(c, cJob),
      candidateIds: [c.id],
      actions: [],
      suggestions: c.status === "shortlisted" || c.status === "in_rounds" ? [`Move ${c.name} to the next round`] : [`Shortlist ${c.name}`],
    };
  }

  if (/\b(send|email|mail)\b.*\bshortlist\b|\bshortlist\b.*\b(to hr|email)\b/.test(lower)) {
    const target = job ?? defaultJob(state);
    return {
      steps: [`Applied the score of ${target.threshold} to ${target.title}`, `Emailed the shortlist to ${state.org.hrEmail}`],
      text: `Sent. HR now has the current shortlist for ${target.title}. ${target.status === "published" ? "The role stays open, and I'll send the final list when it closes." : ""}`,
      actions: [{ type: "sendShortlist", jobId: target.id }],
      open: { name: "emails" },
    };
  }

  if (/\bclose\b/.test(lower) && (job || /\b(role|job)\b/.test(lower))) {
    const target = job ?? defaultJob(state);
    if (target.status !== "published") return { steps: [], text: `${target.title} isn't open right now.`, actions: [] };
    return {
      steps: [`Closed ${target.title}`, `Applied the shortlist score of ${target.threshold}`, `Emailed the final shortlist to ${state.org.hrEmail}`],
      text: `${target.title} is closed. Everyone at ${target.threshold} or above is shortlisted, and the final shortlist is in HR's inbox.`,
      actions: [{ type: "close", jobId: target.id }],
      open: { name: "pipeline", jobId: target.id },
    };
  }

  if (/\b(short ?list(ed)?|top|best|strongest|qualified)\b/.test(lower)) {
    const target = job ?? defaultJob(state);
    const pool = state.candidates
      .filter((c) => c.jobId === target.id && (c.status === "shortlisted" || c.status === "in_rounds" || (c.status === "new" && c.result.score >= target.threshold)))
      .sort((a, b) => b.result.score - a.result.score);
    if (!pool.length) {
      const total = state.candidates.filter((c) => c.jobId === target.id).length;
      return {
        steps: [`Searched ${total} applicants for ${target.title}`],
        text: total
          ? `Nobody for ${target.title} has reached the shortlist score of ${target.threshold} yet.`
          : `${target.title} has no applicants yet.${target.status === "draft" ? " It's still a draft, so publish it to start receiving applications." : " Share your career site link to start receiving applications."}`,
        actions: [],
      };
    }
    const open = target.status === "published";
    return {
      steps: [`Searched ${state.candidates.filter((c) => c.jobId === target.id).length} applicants for ${target.title}`, `Filtered to scores of ${target.threshold}+`],
      text: `${pool.length} candidate${pool.length === 1 ? "" : "s"} ${open ? "currently meet" : "made"} the shortlist for ${target.title}. ${pool[0].name} leads with ${pool[0].result.score}.${open ? " The final list is emailed to HR when the role closes." : ""}`,
      candidateIds: pool.map((c) => c.id),
      actions: [],
      suggestions: [`Compare ${pool[0].name} and ${pool[1]?.name ?? pool[0].name}`, `Move ${pool[0].name} to the next round`],
    };
  }

  if (/\b(clos(e|ing)|deadline|expir|this week|ending)\b/.test(lower)) {
    const open = state.jobs.filter((j) => j.status === "published").sort((a, b) => (a.closesDay ?? 0) - (b.closesDay ?? 0));
    if (!open.length) return { steps: [], text: "No roles are open right now.", actions: [] };
    const soon = open.filter((j) => (daysLeft(j, state.day) ?? 99) <= 7);
    const list = open.map((j) => `${j.title} closes in ${daysLeft(j, state.day)} days`).join("; ");
    return {
      steps: ["Checked every open role"],
      text: `${soon.length ? `${soon.length} role${soon.length === 1 ? " closes" : "s close"} this week.` : "Nothing closes this week."} ${list}.`,
      jobIds: open.map((j) => j.id),
      actions: [],
    };
  }

  if (/\b(interviews?|rounds?|in process|pipeline)\b/.test(lower)) {
    const inRounds = state.candidates.filter((c) => c.status === "in_rounds");
    return {
      steps: ["Checked every pipeline"],
      text: inRounds.length
        ? `${inRounds.length} candidate${inRounds.length === 1 ? " is" : "s are"} in interview rounds right now.`
        : "Nobody is in interview rounds yet. Shortlist a candidate and move them into the first round.",
      candidateIds: inRounds.map((c) => c.id),
      actions: [],
    };
  }

  if (/\b(how many|stats|summary|overview|status|report|applicants|update|dashboard)\b/.test(lower)) {
    const open = state.jobs.filter((j) => j.status === "published").length;
    const count = (s: Candidate["status"]) => state.candidates.filter((c) => c.status === s).length;
    return {
      steps: ["Pulled numbers across every role"],
      text: `You have ${open} open role${open === 1 ? "" : "s"} and ${state.candidates.length} applicants in total. ${count("shortlisted")} ${count("shortlisted") === 1 ? "is" : "are"} shortlisted and waiting for HR, ${count("in_rounds")} ${count("in_rounds") === 1 ? "is" : "are"} in interview rounds, and ${count("hired")} ${count("hired") === 1 ? "has" : "have"} been hired.`,
      jobIds: state.jobs.map((j) => j.id),
      actions: [],
      open: { name: "dashboard" },
    };
  }

  return {
    steps: [],
    text: "I'm not sure how to help with that in this demo yet. Try one of these:",
    actions: [],
    suggestions: STARTER_PROMPTS,
  };
}
