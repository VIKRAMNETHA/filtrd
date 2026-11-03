import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/classes";
import { Logo } from "@/components/logo";

const steps = [
  { title: "Onboard your organization", body: "Answer a few questions and get a career site on your own address, in your brand colour." },
  { title: "Publish a role", body: "Set the resume score to shortlist at, how many days it stays open, and the interview rounds." },
  { title: "Receive your shortlist", body: "Every resume is scored as it arrives. When the role closes, HR gets the shortlist by email." },
  { title: "Run the rounds", body: "Move candidates through each round from one board, with a full history of every decision." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <header className="flex h-20 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className={buttonClass("ghost")}>Sign in</Link>
          <Link href="/signup" className={buttonClass("primary")}>Get started</Link>
        </nav>
      </header>

      <main>
        <section className="pb-20 pt-16 sm:pt-24">
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            From open role to shortlist, without the inbox.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Hireflow gives every organization its own career site and automates resume screening, so your HR team starts with the right candidates.
          </p>
          <div className="mt-9">
            <Link href="/signup" className={buttonClass("primary") + " !h-12 !px-6 !text-[15px]"}>
              Set up your organization <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step.title} className="bg-white p-8">
              <span className="font-mono text-xs text-subtle">0{index + 1}</span>
              <h2 className="mt-5 text-lg font-semibold tracking-tight">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="py-12 text-center text-xs text-subtle">Hireflow</footer>
    </div>
  );
}
