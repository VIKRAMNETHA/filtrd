import { ArrowRight, BadgeCheck, Briefcase, Globe, Layers, Mail, MessageSquare, ShieldCheck, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { CareerSiteVisual, HeroVisual, ScoreVisual } from "@/components/site/visuals";
import { WaitlistForm } from "@/components/site/waitlist-form";
import { buttonClass } from "@/components/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Filtrd gives every company a branded career site, scores every resume the moment it arrives, and emails HR a shortlist when a role closes.",
};

const STEPS = [
  { title: "Set up your company", body: "Answer a few questions. Your workspace and a career site on your own subdomain are ready in minutes." },
  { title: "Publish a role", body: "Choose the resume score to shortlist at, how many days it stays open, and your interview rounds." },
  { title: "Get the shortlist", body: "Every resume is scored as it arrives. When the role closes, HR gets the shortlist by email." },
  { title: "Run the rounds", body: "Move candidates through each round to an offer, with every decision recorded." },
];

const FEATURES = [
  { icon: Globe, title: "Branded career sites", body: "Every company gets its own careers page at yourcompany.filtrd.in, in your brand colour." },
  { icon: SlidersHorizontal, title: "Your rules, per role", body: "Set the shortlist score, active days and interview rounds for each job you post." },
  { icon: BadgeCheck, title: "Explained resume scores", body: "See exactly why a resume scored what it did: matched skills, missing skills and experience." },
  { icon: Mail, title: "Automatic shortlists", body: "When a role closes, the shortlist lands in HR's inbox. No spreadsheets, no chasing." },
  { icon: Layers, title: "Interview pipeline", body: "A clear board for every role, from applied to hired, with notes and a full history." },
  { icon: ShieldCheck, title: "Your data stays yours", body: "Each company's data is kept separate at the database level, not just hidden in the app." },
];

const AGENT_EXAMPLES = [
  "Post a job for a Senior Backend Engineer in Bengaluru",
  "Show me the shortlisted candidates for AI Engineer",
  "Compare Asha Rao and Kabir Singh",
  "Move Asha to the technical interview",
  "Which roles close this week?",
  "Send the shortlist to HR",
];

const FAQ = [
  { q: "Is Filtrd available today?", a: "We're onboarding a small group of pilot companies. The demo on this site shows the full product with sample data. Request access below and we'll set up your workspace." },
  { q: "How are resumes scored?", a: "Each resume is compared with the role's required skills, nice-to-have skills, experience and description. Every score comes with a breakdown, so HR can see why a candidate scored what they did. AI-assisted scoring is being added for pilot companies." },
  { q: "Does Filtrd reject candidates automatically?", a: "No. The score decides who is shortlisted for HR's attention, but people make every hiring decision. HR can shortlist anyone, at any score." },
  { q: "Can each company have its own career site?", a: "Yes. Every company gets a branded careers page on its own subdomain, with only its own open roles." },
  { q: "Is our data separate from other companies?", a: "Yes. Every company's jobs, candidates and resumes are isolated in the database itself, so one company can never see another's data." },
  { q: "What does it cost?", a: "Pilot companies get early access while we shape the product together. Tell us about your hiring below and we'll share the details." },
];

export default function About() {
  return (
    <div className="overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-transparent bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo href="/about" />
          <nav className="flex items-center gap-1">
            <span className="hidden items-center gap-1 md:flex">
              <a href="#how" className={buttonClass("ghost", "sm")}>How it works</a>
              <a href="#agent" className={buttonClass("ghost", "sm")}>Agent</a>
              <a href="#faq" className={buttonClass("ghost", "sm")}>FAQ</a>
            </span>
            <a href="#waitlist" className={buttonClass("ghost", "sm")}>Join the pilot</a>
            <Link href="/" className={buttonClass("primary", "sm")}>Talk to the agent</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Now onboarding pilot companies
            </span>
            <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.04] tracking-tight sm:text-6xl">
              Hiring on autopilot. Decisions in your hands.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Filtrd gives your company a branded career site, scores every resume the moment it arrives, and sends HR a shortlist when a role closes. Or just ask the hiring agent.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/" className={buttonClass("primary", "lg")}>Talk to the agent <ArrowRight size={16} /></Link>
              <Link href="/demo" className={buttonClass("secondary", "lg")}>Take the guided tour</Link>
            </div>
            <p className="mt-4 text-xs text-subtle">No sign-up needed. The demo runs in your browser with sample data.</p>
          </div>
          <HeroVisual />
        </section>

        <section id="how" className="scroll-mt-20 border-t border-line bg-wash/50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-sm font-medium text-muted">How it works</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">From open role to shortlist in four steps</h2>
            <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-card border border-line bg-white p-6">
                  <span className="font-mono text-xs text-subtle">0{i + 1}</span>
                  <h3 className="mt-6 font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted">Career sites</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">A careers page that looks like you</h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted">Every company gets its own career site on its own subdomain, with your name, tagline and brand colour. Publish a role and it&apos;s live there instantly.</p>
          </div>
          <CareerSiteVisual />
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-24 sm:px-6 lg:grid-cols-2">
          <div className="lg:order-2">
            <p className="text-sm font-medium text-muted">Resume scoring</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Every resume scored, and every score explained</h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted">Resumes are scored against the skills and experience you asked for, the moment they arrive. HR sees which skills were found and which were missing, not a mystery number.</p>
          </div>
          <div className="lg:order-1"><ScoreVisual /></div>
        </section>

        <section id="agent" className="mx-auto max-w-6xl scroll-mt-20 px-4 sm:px-6">
          <div className="grid items-center gap-12 rounded-[28px] border border-line bg-wash/60 px-6 py-14 sm:px-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs text-muted"><Sparkles size={12} /> Hiring agent · in preview</span>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Just ask. The agent does the work.</h2>
              <p className="mt-4 max-w-md leading-relaxed text-muted">Post a role, find your strongest candidates, compare two people or move someone to the next round, in plain English. Every action shows up in the pipeline, so nothing happens out of sight.</p>
              <Link href="/" className={`mt-8 ${buttonClass("primary", "lg")}`}>Talk to the agent <ArrowRight size={16} /></Link>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {AGENT_EXAMPLES.map((q) => (
                <li key={q} className="flex items-start gap-2.5 rounded-[16px] border border-line bg-white px-4 py-3.5 text-sm">
                  <MessageSquare size={15} className="mt-0.5 shrink-0 text-subtle" /> {q}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <p className="text-sm font-medium text-muted">Features</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Everything between “we&apos;re hiring” and “you&apos;re hired”</h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white p-7">
                <Icon size={20} strokeWidth={1.6} />
                <h3 className="mt-5 font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-line bg-wash/50 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="text-sm font-medium text-muted">Fair by design</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Automation that keeps people in charge</h2>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2">
              {[
                [Users, "People make every decision", "Scores decide who HR looks at first, never who gets rejected."],
                [BadgeCheck, "Scores you can explain", "Every score shows the skills and experience behind it."],
                [Briefcase, "Experience isn't penalised", "Candidates with more experience than asked for don't lose points."],
                [ShieldCheck, "Consent from every applicant", "Candidates agree to how their application is processed."],
              ].map(([Icon, title, body]) => {
                const I = Icon as typeof Users;
                return (
                  <li key={title as string}>
                    <I size={18} strokeWidth={1.6} />
                    <h3 className="mt-3 text-sm font-semibold">{title as string}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{body as string}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-24 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Questions</h2>
          <div className="mt-8 divide-y divide-line rounded-card border border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-xl leading-none text-subtle transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="waitlist" className="scroll-mt-20 border-t border-line bg-wash/50 py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-sm font-medium text-muted">Pilot program</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Hire your next team with Filtrd</h2>
              <p className="mt-4 max-w-md leading-relaxed text-muted">We&apos;re working closely with a small group of companies to shape Filtrd. Pilot companies get a set-up call, their own career site and direct access to the team.</p>
              <Link href="/demo" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline">Not ready yet? Try the demo first <ArrowRight size={14} /></Link>
            </div>
            <WaitlistForm />
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:px-6">
        <Logo />
        <p>© {new Date().getFullYear()} Filtrd. All rights reserved.</p>
      </footer>
    </div>
  );
}
