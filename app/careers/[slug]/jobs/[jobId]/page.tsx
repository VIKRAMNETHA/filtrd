import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EMPLOYMENT_LABELS, formatDate, WORKPLACE_LABELS } from "@/components/display";
import { getPublicJob } from "@/lib/career-job";
import { careerBase, getPublicOrg } from "@/lib/careers";

type Params = { params: Promise<{ slug: string; jobId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, jobId } = await params;
  const org = await getPublicOrg(slug);
  const job = org && (await getPublicJob(org, jobId));
  return job ? { title: job.title } : {};
}

export default async function CareerJobPage({ params }: Params) {
  const { slug, jobId } = await params;
  const org = await getPublicOrg(slug);
  if (!org) notFound();
  const job = await getPublicJob(org, jobId);
  if (!job) notFound();
  const base = await careerBase(org.slug);

  const facts = [
    job.department,
    job.location,
    WORKPLACE_LABELS[job.workplace],
    EMPLOYMENT_LABELS[job.employmentType],
    job.experienceMin != null ? `${job.experienceMin}${job.experienceMax != null ? `–${job.experienceMax}` : "+"} years` : null,
    job.salaryRange,
  ].filter(Boolean);
  const applyClass = "inline-flex h-11 items-center justify-center rounded-control bg-brand px-6 text-sm font-medium text-white transition-opacity hover:opacity-85";

  return (
    <article className="pt-4">
      <Link href={base || "/"} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft size={14} /> All roles
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{job.title}</h1>
      <p className="mt-3 text-sm text-muted">{facts.join(" · ")}</p>
      <div className="mt-6">
        <Link href={`${base}/jobs/${job.id}/apply`} className={applyClass}>Apply for this role</Link>
      </div>

      <div className="mt-10 whitespace-pre-line border-t border-line pt-8 text-[15px] leading-7">{job.description}</div>

      {job.requiredSkills.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">Skills we&apos;re looking for</h2>
          <div className="flex flex-wrap gap-1.5">
            {job.requiredSkills.map((s) => <span key={s} className="rounded-full bg-wash px-3 py-1 text-[13px]">{s}</span>)}
            {job.niceSkills.map((s) => <span key={s} className="rounded-full border border-line px-3 py-1 text-[13px] text-muted">{s}</span>)}
          </div>
        </section>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-4 rounded-card border border-line p-6">
        <Link href={`${base}/jobs/${job.id}/apply`} className={applyClass}>Apply for this role</Link>
        <p className="text-[13px] text-muted">Applications close {formatDate(job.closesAt)}</p>
      </div>
    </article>
  );
}
