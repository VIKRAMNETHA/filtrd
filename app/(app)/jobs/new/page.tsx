import type { Metadata } from "next";
import { PageHeader } from "@/components/display";
import { JobForm } from "@/components/job-form";
import { requireOrg } from "@/lib/auth";

export const metadata: Metadata = { title: "Create job" };

export default async function NewJobPage() {
  const { settings } = await requireOrg();
  return (
    <>
      <PageHeader title="Create job" />
      <JobForm
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
