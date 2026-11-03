import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EMPLOYMENT_LABELS, WORKPLACE_LABELS } from "@/components/display";
import { careerBase, getPublicOrg } from "@/lib/careers";
import { withTenant } from "@/lib/db";
import type { Job } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const org = await getPublicOrg((await params).slug);
  return org ? { title: { absolute: `Careers at ${org.name}` } } : {};
}

export default async function CareersHome({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ department?: string }> }) {
  const { slug } = await params;
  const { department } = await searchParams;
  const org = await getPublicOrg(slug);
  if (!org) notFound();
  const base = await careerBase(org.slug);

  const jobs = await withTenant(org.id, (tx) => tx<Job[]>`
    select id, title, department, location, workplace, employment_type from jobs
    where status = 'published' and closes_at > now() order by published_at desc`);
  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))] as string[];
  const visible = department ? jobs.filter((j) => j.department === department) : jobs;

  const chip = "inline-flex h-8 items-center rounded-full border px-3.5 text-[13px] transition-colors";

  return (
    <>
      <section className="pb-12 pt-10 sm:pt-16">
        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">{org.tagline || `Careers at ${org.name}`}</h1>
        {org.about && <p className="mt-5 max-w-2xl whitespace-pre-line text-base leading-relaxed text-muted">{org.about}</p>}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">{jobs.length} open role{jobs.length === 1 ? "" : "s"}</h2>
          {departments.length > 1 && (
            <nav aria-label="Filter by department" className="flex flex-wrap gap-1.5">
              <Link href={base || "/"} className={`${chip} ${!department ? "border-brand bg-brand text-white" : "border-line hover:bg-wash"}`}>All</Link>
              {departments.map((d) => (
                <Link key={d} href={`${base}?department=${encodeURIComponent(d)}`} className={`${chip} ${department === d ? "border-brand bg-brand text-white" : "border-line hover:bg-wash"}`}>{d}</Link>
              ))}
            </nav>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-card border border-dashed border-line px-6 py-14 text-center text-sm text-muted">
            There are no open roles right now. Please check back soon.
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-card border border-line">
            {visible.map((job) => (
              <li key={job.id}>
                <Link href={`${base}/jobs/${job.id}`} className="group flex items-center justify-between gap-4 px-6 py-5 hover:bg-wash/60">
                  <div className="min-w-0">
                    <p className="font-medium">{job.title}</p>
                    <p className="mt-1 text-[13px] text-muted">
                      {[job.department, job.location, WORKPLACE_LABELS[job.workplace], EMPLOYMENT_LABELS[job.employmentType]].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <ArrowRight size={16} className="shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
