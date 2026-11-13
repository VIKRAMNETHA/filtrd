"use client";

import { Briefcase, Globe, LayoutGrid, Mail, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "../logo";
import { buttonClass, cx } from "../ui";
import { AgentChat } from "./agent-chat";
import { CareerSite } from "./career";
import { DemoProvider, useDemo } from "./context";
import { CandidateView, Dashboard, Emails, Jobs, NewJob, Onboarding, Pipeline } from "./hr-screens";
import { TourBar } from "./tour";

const NAV = [
  { key: "dashboard", label: "Overview", icon: LayoutGrid },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "emails", label: "Emails", icon: Mail },
  { key: "career", label: "Career site", icon: Globe },
] as const;

function Shell() {
  const { screen, go, state, reset, setAgentOpen } = useDemo();
  const active =
    screen.name === "pipeline" || screen.name === "new-job" || screen.name === "candidate" ? "jobs" : screen.name === "onboarding" ? "" : screen.name;
  const unread = state.emails.length;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight"><LogoMark size={22} /> Filtrd</Link>
            <span className="hidden truncate rounded-full bg-wash px-2.5 py-1 text-xs text-muted sm:inline">Interactive demo · sample data · nothing is saved</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={reset} className={buttonClass("ghost", "sm")}><RotateCcw size={13} /> <span className="hidden sm:inline">Reset</span></button>
            <Link href="/about#waitlist" className={buttonClass("primary", "sm")}>Join the pilot</Link>
          </div>
        </div>
      </header>
      <TourBar />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row">
        {state.org.onboarded && (
          <nav aria-label="Demo navigation" className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-56 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r lg:px-3 lg:py-5">
            <p className="mb-3 hidden px-2.5 text-[13px] font-medium lg:block">{state.org.name}</p>
            {NAV.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => go({ name: key } as never)}
                aria-current={active === key ? "page" : undefined}
                className={cx("flex h-9 shrink-0 items-center gap-2.5 rounded-[10px] px-2.5 text-sm", active === key ? "bg-wash font-medium" : "text-muted hover:bg-wash hover:text-ink")}
              >
                <Icon size={16} strokeWidth={1.75} /> {label}
                {key === "emails" && unread > 0 && <span className="ml-auto rounded-full bg-ink px-1.5 text-[11px] font-semibold text-white">{unread}</span>}
              </button>
            ))}
            <button type="button" onClick={() => setAgentOpen(true)} className="flex h-9 shrink-0 items-center gap-2.5 rounded-[10px] px-2.5 text-sm text-muted hover:bg-wash hover:text-ink">
              <Sparkles size={16} strokeWidth={1.75} /> Hiring agent
            </button>
          </nav>
        )}
        <main id="demo-main" className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
          {screen.name === "onboarding" && <Onboarding />}
          {screen.name === "dashboard" && <Dashboard />}
          {screen.name === "jobs" && <Jobs />}
          {screen.name === "new-job" && <NewJob />}
          {screen.name === "pipeline" && <Pipeline jobId={screen.jobId} />}
          {screen.name === "candidate" && <CandidateView candidateId={screen.candidateId} />}
          {screen.name === "emails" && <Emails emailId={screen.emailId} />}
          {screen.name === "career" && <CareerSite jobId={screen.jobId} apply={screen.apply} />}
        </main>
      </div>
      <AgentChat />
    </div>
  );
}

export function DemoApp() {
  return (
    <DemoProvider>
      <Shell />
    </DemoProvider>
  );
}
