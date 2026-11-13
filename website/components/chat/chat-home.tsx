"use client";

import { ArrowUp, BarChart3, Briefcase, Compass, Globe, LayoutGrid, Mail, Menu, PanelRight, Plus, Sparkles, UserSearch, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DemoProvider, useDemo } from "../demo/context";
import { CareerSite } from "../demo/career";
import { CandidateView, Dashboard, Emails, Jobs, NewJob, Pipeline } from "../demo/hr-screens";
import { LogoMark } from "../logo";
import { buttonClass, cx } from "../ui";
import { AgentMessage } from "./agent-message";

const STARTERS = [
  { icon: UserSearch, title: "Find my best candidates", prompt: "Show me the shortlisted candidates for AI Engineer" },
  { icon: Briefcase, title: "Post a new role", prompt: "Post a job for a Senior Backend Engineer in Bengaluru with a score of 70" },
  { icon: Users, title: "Compare two people", prompt: "Compare Asha Rao and Kabir Singh" },
  { icon: BarChart3, title: "Get a hiring update", prompt: "Give me an overview of our hiring" },
];

const MORE_PROMPTS = ["Which roles close this week?", "Tell me about Meera Iyer", "Close the AI Engineer role", "Show me the career site", "What can Filtrd do?"];

function Composer({ autoFocus, large }: { autoFocus?: boolean; large?: boolean }) {
  const { ask, typing } = useDemo();
  const [draft, setDraft] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft]);

  const send = () => {
    if (!draft.trim() || typing) return;
    ask(draft);
    setDraft("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className={cx(
        "flex items-end gap-2 rounded-[26px] border border-line bg-white px-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] transition-colors focus-within:border-subtle",
        large ? "py-3.5" : "py-2.5",
      )}
    >
      <textarea
        ref={ref}
        rows={1}
        autoFocus={autoFocus}
        value={draft}
        aria-label="Message the hiring agent"
        placeholder="Ask the hiring agent anything…"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        className={cx("flex-1 resize-none bg-transparent py-1.5 placeholder:text-subtle focus:outline-none", large ? "text-base" : "text-[15px]")}
      />
      <button type="submit" aria-label="Send" disabled={!draft.trim() || typing} className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-white transition-opacity disabled:opacity-25">
        <ArrowUp size={18} />
      </button>
    </form>
  );
}

/** Docked on wide screens; becomes a drawer on phones, and while the workspace panel needs the room. */
function Sidebar({ open, onClose, docked }: { open: boolean; onClose: () => void; docked: boolean }) {
  const { reset, ask, typing, messages } = useDemo();
  const run = (prompt: string) => {
    ask(prompt);
    onClose();
  };
  return (
    <>
      {open && <button type="button" aria-label="Close menu" onClick={onClose} className={cx("fixed inset-0 z-50 bg-black/20", docked && "lg:hidden")} />}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-[272px] shrink-0 flex-col border-r border-line bg-white px-3 py-4 transition-transform",
          open ? "translate-x-0" : "-translate-x-full",
          docked && "lg:static lg:z-auto lg:translate-x-0",
        )}
      >
        <div className="mb-5 flex items-center justify-between px-2">
          <Link href="/" className="inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight"><LogoMark size={24} /> Filtrd</Link>
          <button type="button" aria-label="Close menu" onClick={onClose} className={cx("grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-wash", docked && "lg:hidden")}><X size={16} /></button>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            onClose();
          }}
          className="flex h-10 items-center gap-2 rounded-[12px] border border-line px-3 text-sm font-medium hover:bg-wash"
        >
          <Plus size={16} /> New chat
        </button>

        <p className="mb-1.5 mt-6 px-2 text-xs font-medium text-subtle">Try asking</p>
        <div className="space-y-0.5">
          {[...STARTERS.map((s) => s.prompt), ...MORE_PROMPTS].slice(messages.length ? 0 : 4).map((p) => (
            <button key={p} type="button" disabled={typing} onClick={() => run(p)} className="block w-full truncate rounded-[10px] px-2.5 py-2 text-left text-[13px] text-muted hover:bg-wash hover:text-ink disabled:opacity-50">
              {p}
            </button>
          ))}
        </div>

        <div className="mt-auto space-y-0.5 pt-6">
          <Link href="/demo" className="flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-sm text-muted hover:bg-wash hover:text-ink"><Compass size={16} strokeWidth={1.75} /> Guided product tour</Link>
          <Link href="/about" className="flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-sm text-muted hover:bg-wash hover:text-ink"><Sparkles size={16} strokeWidth={1.75} /> About Filtrd</Link>
          <button type="button" onClick={() => run("Join the pilot")} className={cx(buttonClass("primary"), "mt-2 w-full")}>Join the pilot</button>
          <p className="px-2 pt-3 text-[11px] leading-relaxed text-subtle">Demo workspace for Acme Robotics. Sample data, nothing is saved.</p>
        </div>
      </aside>
    </>
  );
}

const TABS = [
  { name: "dashboard", label: "Overview", icon: LayoutGrid },
  { name: "jobs", label: "Jobs", icon: Briefcase },
  { name: "emails", label: "Emails", icon: Mail },
  { name: "career", label: "Career site", icon: Globe },
] as const;

/** The live workspace beside the chat, like an artifact: everything the agent changes shows up here. */
function WorkspacePanel() {
  const { screen, go, panelOpen, setPanelOpen } = useDemo();
  const active = screen.name === "pipeline" || screen.name === "new-job" || screen.name === "candidate" ? "jobs" : screen.name;
  if (!panelOpen) return null;
  return (
    <section aria-label="Workspace" className="fixed inset-0 z-40 flex flex-col bg-white lg:static lg:z-auto lg:w-[50%] lg:max-w-[740px] lg:shrink-0 lg:border-l lg:border-line">
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-line px-3">
        <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {TABS.map(({ name, label, icon: Icon }) => (
            <button key={name} type="button" onClick={() => go({ name } as never)} aria-current={active === name ? "page" : undefined} className={cx("flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] px-2.5 text-[13px]", active === name ? "bg-wash font-medium" : "text-muted hover:bg-wash hover:text-ink")}>
              <Icon size={14} strokeWidth={1.75} /> {label}
            </button>
          ))}
        </nav>
        <button type="button" aria-label="Close workspace" onClick={() => setPanelOpen(false)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-wash hover:text-ink"><X size={16} /></button>
      </header>
      <div id="demo-main" className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {screen.name === "dashboard" && <Dashboard />}
        {screen.name === "jobs" && <Jobs />}
        {screen.name === "new-job" && <NewJob />}
        {screen.name === "pipeline" && <Pipeline jobId={screen.jobId} />}
        {screen.name === "candidate" && <CandidateView candidateId={screen.candidateId} />}
        {screen.name === "emails" && <Emails emailId={screen.emailId} />}
        {screen.name === "career" && <CareerSite jobId={screen.jobId} apply={screen.apply} />}
        {screen.name === "onboarding" && <Dashboard />}
      </div>
    </section>
  );
}

function Conversation() {
  const { messages, typing } = useDemo();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 pb-8 pt-6 sm:px-6" aria-live="polite">
      {messages.map((m) =>
        m.role === "user" ? (
          <div key={m.id} className="animate-rise flex justify-end">
            <p className="max-w-[85%] whitespace-pre-wrap rounded-[22px] bg-wash px-4 py-2.5 text-[15px] leading-relaxed">{m.text}</p>
          </div>
        ) : (
          <div key={m.id} className="animate-rise flex gap-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line"><LogoMark size={14} /></span>
            <div className="min-w-0 flex-1">
              <AgentMessage message={m} isLast={m.id === messages[messages.length - 1].id} />
            </div>
          </div>
        ),
      )}
      {typing && (
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line"><LogoMark size={14} /></span>
          <span className="flex gap-1" aria-label="Agent is typing">
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted" />
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted" />
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted" />
          </span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

function EmptyState() {
  const { ask } = useDemo();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <LogoMark size={40} className="mx-auto" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">What are you hiring for today?</h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
          I&apos;m the Filtrd hiring agent. I post jobs, score every resume, shortlist candidates and run your interview rounds. Try me on Acme Robotics&apos; demo workspace.
        </p>
      </div>
      <Composer autoFocus large />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {STARTERS.map(({ icon: Icon, title, prompt }) => (
          <button key={title} type="button" onClick={() => ask(prompt)} className="group flex items-start gap-3 rounded-[18px] border border-line bg-white p-4 text-left transition-colors hover:bg-wash/60">
            <Icon size={18} strokeWidth={1.6} className="mt-0.5 shrink-0 text-muted group-hover:text-ink" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{title}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-muted">{prompt}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatLayout() {
  const { messages, panelOpen, setPanelOpen, reset } = useDemo();
  const [menuOpen, setMenuOpen] = useState(false);
  const started = messages.length > 0;

  return (
    <div className="flex h-dvh overflow-hidden bg-white">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} docked={!panelOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-3 sm:px-4">
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)} className={cx("grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-wash", !panelOpen && "lg:hidden")}><Menu size={18} /></button>
            <span className={cx("text-sm font-medium", !panelOpen && "lg:pl-1")}>Hiring agent</span>
            <span className="ml-1 hidden rounded-full bg-wash px-2 py-0.5 text-[11px] text-muted sm:inline">Demo</span>
          </div>
          <div className="flex items-center gap-1">
            {started && (
              <button type="button" onClick={reset} aria-label="New chat" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-wash lg:hidden"><Plus size={18} /></button>
            )}
            {!panelOpen && (
              <button type="button" onClick={() => setPanelOpen(true)} className={buttonClass("ghost", "sm")}><PanelRight size={15} /> Workspace</button>
            )}
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{started ? <Conversation /> : <EmptyState />}</main>

        {started && (
          <div className="shrink-0 px-4 pb-4 pt-1 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <Composer autoFocus />
              <p className="mt-2 text-center text-[11px] text-subtle">A scripted preview of the Filtrd agent, using sample data.</p>
            </div>
          </div>
        )}
      </div>
      <WorkspacePanel />
    </div>
  );
}

export function ChatHome() {
  return (
    <DemoProvider mode="chat">
      <ChatLayout />
    </DemoProvider>
  );
}
