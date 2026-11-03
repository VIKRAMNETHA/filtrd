import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/display";
import { JobForm } from "@/components/job-form";
import { requireOrg } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import type { Job, Round } from "@/lib/types";

export const metadata: Metadata = { title: "Edit job" };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { org, settings } = await requireOrg();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await withTenant(org.id, async (tx) => {
    const [job] = await tx<Job[]>`select * from jobs where id = ${id}`;
    if (!job) return null;
    const rounds = await tx<Round[]>`select * from job_rounds where job_id = ${id} order by position`;
    const [inRound] = await tx`select 1 from applications where job_id = ${id} and current_round_id is not null limit 1`;
    return { job, rounds, roundsLocked: Boolean(inRound) };
  });
  if (!data) notFound();

  return (
    <>
      <PageHeader title={`Edit ${data.job.title}`} />
      <JobForm
        job={data.job}
        rounds={data.rounds}
        roundsLocked={data.roundsLocked}
        defaults={{
          threshold: settings.defaultThreshold,
          activeDays: settings.defaultActiveDays,
          hrEmail: settings.hrEmail,
          rounds: settings.defaultRounds,
          departments: settings.departments,
        }}
      />
    </>
  );
}
