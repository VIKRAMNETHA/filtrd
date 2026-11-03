import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/apply-form";
import { getPublicJob } from "@/lib/career-job";
import { careerBase, getPublicOrg } from "@/lib/careers";

export const metadata: Metadata = { title: "Apply" };

export default async function ApplyPage({ params }: { params: Promise<{ slug: string; jobId: string }> }) {
  const { slug, jobId } = await params;
  const org = await getPublicOrg(slug);
  if (!org) notFound();
  const job = await getPublicJob(org, jobId);
  if (!job) notFound();
  const base = await careerBase(org.slug);

  return (
    <div className="pt-4">
      <Link href={`${base}/jobs/${job.id}`} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft size={14} /> {job.title}
      </Link>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Apply for {job.title}</h1>
      <ApplyForm slug={org.slug} jobId={job.id} jobTitle={job.title} orgName={org.name} backHref={base || "/"} />
    </div>
  );
}
