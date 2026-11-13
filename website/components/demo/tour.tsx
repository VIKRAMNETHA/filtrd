"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { STARTER_PROMPTS } from "@/lib/demo/agent";
import type { DemoState, Screen } from "@/lib/demo/types";
import { Button, buttonClass, cx } from "../ui";
import { useDemo } from "./context";

type Step = {
  title: string;
  body: string;
  done: (s: DemoState, ctx: { visitedCareer: boolean; asked: boolean }) => boolean;
  screen: Screen;
};

const isLiveOrClosed = (s: DemoState) => s.jobs.some((j) => j.id === "job-ai" && j.status !== "draft");

export const STEPS: Step[] = [
  { title: "Set up your organization", body: "A few questions, and your workspace and branded career site are ready.", done: (s) => s.org.onboarded, screen: { name: "onboarding" } },
  { title: "Create a role", body: "Set the resume score to shortlist at, how long it stays open, and the interview rounds.", done: isLiveOrClosed, screen: { name: "new-job" } },
  { title: "See your career site", body: "This is what candidates see on your own subdomain.", done: (_, c) => c.visitedCareer, screen: { name: "career" } },
  { title: "Watch resumes get scored", body: "Applications arrive, and each resume is scored the moment it lands.", done: (s) => isLiveOrClosed(s) && (!s.queue.some((a) => a.jobId === "job-ai") || s.jobs.some((j) => j.id === "job-ai" && j.status === "closed")), screen: { name: "pipeline", jobId: "job-ai" } },
  { title: "Get the shortlist by email", body: "When the role closes, everyone at or above the score is shortlisted and HR gets an email.", done: (s) => s.jobs.some((j) => j.id === "job-ai" && j.shortlistSent), screen: { name: "pipeline", jobId: "job-ai" } },
  { title: "Run the interview rounds", body: "Move shortlisted candidates through each round, then hire.", done: (s) => s.candidates.some((c) => c.jobId === "job-ai" && (c.status === "in_rounds" || c.status === "hired")), screen: { name: "candidate", candidateId: "c1" } },
  { title: "Ask the hiring agent", body: "Post jobs, find candidates and move people forward in plain English.", done: (_, c) => c.asked, screen: { name: "dashboard" } },
];

export function TourBar() {
  const demo = useDemo();
  const { state, dispatch, go, visitedCareer, messages, setAgentOpen, ask, simulate, reset } = demo;
  const ctx = { visitedCareer, asked: messages.some((m) => m.role === "user") };
  const doneFlags = STEPS.map((s) => s.done(state, ctx));
  const current = doneFlags.indexOf(false);
  const finished = current === -1;

  // Each step can also be done for the visitor, so the tour never gets stuck.
  const doIt = () => {
    switch (current) {
      case 0:
        dispatch({ type: "onboard", org: {} });
        go({ name: "dashboard" });
        break;
      case 1:
        dispatch({ type: "publish", jobId: "job-ai" });
        go({ name: "pipeline", jobId: "job-ai" });
        break;
      case 2:
        go({ name: "career" });
        break;
      case 3:
        go({ name: "pipeline", jobId: "job-ai" });
        simulate();
        break;
      case 4:
        dispatch({ type: "close", jobId: "job-ai" });
        go({ name: "emails" });
        break;
      case 5: {
        const top = [...state.candidates].filter((c) => c.jobId === "job-ai" && c.status === "shortlisted").sort((a, b) => b.result.score - a.result.score)[0];
        if (top) {
          dispatch({ type: "advance", candidateId: top.id });
          go({ name: "candidate", candidateId: top.id });
        }
        break;
      }
      case 6:
        setAgentOpen(true);
        ask(STARTER_PROMPTS[0]);
        break;
    }
  };

  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <ol className="mt-1.5 flex shrink-0 gap-1" aria-label="Tour progress">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <button
                  type="button"
                  aria-label={`Step ${i + 1}: ${step.title}${doneFlags[i] ? " (done)" : ""}`}
                  onClick={() => go(step.screen)}
                  className={cx("block h-1.5 w-5 rounded-full transition-colors", doneFlags[i] ? "bg-ink" : i === current ? "bg-ink/35" : "bg-line")}
                />
              </li>
            ))}
          </ol>
          <div className="min-w-0">
            {finished ? (
              <>
                <p className="text-sm font-semibold">You&apos;ve seen the whole flow</p>
                <p className="text-[13px] text-muted">Keep exploring, chat with the agent, or join the pilot.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold">
                  <span className="text-muted">Step {current + 1} of {STEPS.length} · </span>
                  {STEPS[current].title}
                </p>
                <p className="text-[13px] text-muted">{STEPS[current].body}</p>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {finished ? (
            <>
              <Button variant="secondary" size="sm" onClick={reset}><RotateCcw size={13} /> Start over</Button>
              <Link href="/about#waitlist" className={buttonClass("primary", "sm")}>Join the pilot</Link>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => (current === 6 ? setAgentOpen(true) : go(STEPS[current].screen))}>Show me</Button>
              <Button size="sm" onClick={doIt}><Sparkles size={13} /> Do it for me</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

