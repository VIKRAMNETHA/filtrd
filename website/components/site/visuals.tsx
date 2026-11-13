import { Check, Lock, Sparkles } from "lucide-react";
import { ScorePill } from "../ui";

const PEOPLE = [
  { name: "Asha Rao", note: "4 of 4 required skills", score: 95 },
  { name: "Kabir Singh", note: "4 of 4 required skills", score: 88 },
  { name: "Rahul Mehta", note: "Strong NLP background", score: 84 },
  { name: "Meera Iyer", note: "Missing PyTorch", score: 58 },
];

/** Product composite for the hero: a pipeline card with the agent answering beside it. */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="rounded-[24px] border border-line bg-white p-4 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">AI Engineer</p>
            <p className="text-xs text-muted">8 applied · shortlist score 60+ · closes in 3 days</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Live</span>
        </div>
        <ul className="space-y-1.5">
          {PEOPLE.map((p) => (
            <li key={p.name} className="flex items-center justify-between gap-3 rounded-[14px] border border-line px-3 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium">{p.name}</span>
                <span className="block truncate text-xs text-muted">{p.note}</span>
              </span>
              <ScorePill score={p.score} threshold={60} />
            </li>
          ))}
        </ul>
      </div>
      <div className="relative -mt-6 ml-auto w-[88%] rounded-[22px] border border-line bg-white p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.4)] sm:-mt-10 sm:w-[78%]">
        <div className="mb-3 flex justify-end">
          <p className="rounded-[16px] rounded-br-md bg-ink px-3 py-2 text-[13px] text-white">Move Asha to the technical interview</p>
        </div>
        <div className="flex gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-ink text-white"><Sparkles size={13} /></span>
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs text-muted"><Check size={12} className="text-emerald-600" /> Moved Asha Rao to Technical interview</p>
            <p className="flex items-center gap-1.5 text-xs text-muted"><Check size={12} className="text-emerald-600" /> Emailed the candidate</p>
            <p className="rounded-[16px] rounded-bl-md bg-wash px-3 py-2 text-[13px]">Done. Asha is in the technical interview and knows what&apos;s next.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CareerSiteVisual() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_30px_70px_-45px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-2 border-b border-line bg-wash px-3 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-line" /><span className="h-2.5 w-2.5 rounded-full bg-line" /><span className="h-2.5 w-2.5 rounded-full bg-line" /></span>
        <span className="mx-auto flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs text-muted"><Lock size={10} /> acme.filtrd.in</span>
      </div>
      <div className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-2.5 text-sm font-semibold"><span className="grid h-7 w-7 place-items-center rounded-[9px] bg-[#2563eb] text-xs font-bold text-white">A</span>Acme Robotics</div>
        <p className="text-2xl font-semibold leading-tight tracking-tight">Build the robots that build everything else</p>
        <p className="mb-6 mt-2 text-sm text-muted">3 open roles</p>
        {[["AI Engineer", "Engineering · Hyderabad · Hybrid"], ["Product Designer", "Design · Bengaluru · Remote"], ["Backend Engineer", "Engineering · Bengaluru · Hybrid"]].map(([t, m]) => (
          <div key={t} className="mb-2 rounded-[14px] border border-line px-4 py-3">
            <p className="text-sm font-medium">{t}</p>
            <p className="text-xs text-muted">{m}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScoreVisual() {
  const parts = [
    ["Required skills", 57, 57],
    ["Nice-to-have skills", 10, 10],
    ["Experience", 14, 14],
    ["Role relevance", 14, 19],
  ] as const;
  return (
    <div className="rounded-[22px] border border-line bg-white p-6 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.4)] sm:p-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium">Resume score · Asha Rao</p>
          <p className="mt-1 text-5xl font-semibold tabular-nums tracking-tight">95</p>
          <p className="mt-1 text-xs text-muted">Meets the shortlist score of 60</p>
        </div>
        <span className="rounded-full bg-wash px-2.5 py-1 text-xs text-muted">Explained</span>
      </div>
      <div className="mt-6 space-y-3">
        {parts.map(([label, points, max]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-[13px]"><span>{label}</span><span className="tabular-nums text-muted">{points} / {max}</span></div>
            <div className="h-1.5 rounded-full bg-wash"><div className="h-full rounded-full bg-ink" style={{ width: `${(points / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {["Python", "PyTorch", "LLM", "RAG", "Kubernetes"].map((s) => <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{s}</span>)}
      </div>
    </div>
  );
}
