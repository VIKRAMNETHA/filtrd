// The same keyword scorer the Filtrd app uses, so demo scores behave like the product's.

export type ScoringJob = {
  title: string;
  description: string;
  requiredSkills: string[];
  niceSkills: string[];
  experienceMin: number | null;
};

export type ScoreResult = {
  score: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  breakdown: { label: string; points: number; max: number }[];
};

const STOP_WORDS = new Set(
  "about above across after again against also among and are because been before being between both but can could did does doing down during each few for from further had has have having her here hers him his how into its just like more most much must need needs other our out over own same she should some such than that the their them then there these they this those through too under until very was were what when where which while who whom why will with within without work working would years you your team role able strong good great experience".split(" "),
);

function hasTerm(text: string, term: string) {
  const escaped = term.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!escaped) return false;
  return new RegExp(`(^|[^a-z0-9+#.])${escaped}($|[^a-z0-9+#])`, "i").test(text);
}

function keywords(text: string) {
  const counts = new Map<string, number>();
  for (const word of text.toLowerCase().match(/[a-z][a-z0-9+#-]{2,}/g) ?? []) {
    if (!STOP_WORDS.has(word)) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([w]) => w);
}

export function scoreResume(job: ScoringJob, resumeText: string, years: number | null): ScoreResult {
  const text = resumeText.toLowerCase();
  const matched = job.requiredSkills.filter((s) => hasTerm(text, s));
  const missingSkills = job.requiredSkills.filter((s) => !hasTerm(text, s));
  const matchedNice = job.niceSkills.filter((s) => hasTerm(text, s));

  const parts: { label: string; earned: number; max: number }[] = [];
  if (job.requiredSkills.length) parts.push({ label: "Required skills", earned: matched.length / job.requiredSkills.length, max: 60 });
  if (job.niceSkills.length) parts.push({ label: "Nice-to-have skills", earned: matchedNice.length / job.niceSkills.length, max: 10 });
  if (job.experienceMin) parts.push({ label: "Experience", earned: years == null ? 0 : Math.min(years / job.experienceMin, 1), max: 15 });
  const terms = keywords(`${job.title} ${job.title} ${job.description}`);
  if (terms.length) parts.push({ label: "Role relevance", earned: terms.filter((t) => hasTerm(text, t)).length / terms.length, max: 15 });

  const totalMax = parts.reduce((sum, p) => sum + p.max, 0) || 1;
  const scale = 100 / totalMax;
  return {
    score: Math.min(100, Math.round(parts.reduce((sum, p) => sum + p.earned * p.max, 0) * scale)),
    summary: job.requiredSkills.length
      ? `Matched ${matched.length} of ${job.requiredSkills.length} required skills${missingSkills.length ? `; missing ${missingSkills.slice(0, 3).join(", ")}` : ""}.`
      : "Scored on overlap between the resume and the job description.",
    matchedSkills: [...matched, ...matchedNice],
    missingSkills,
    breakdown: parts.map((p) => ({ label: p.label, points: Math.round(p.earned * p.max * scale), max: Math.round(p.max * scale) })),
  };
}
