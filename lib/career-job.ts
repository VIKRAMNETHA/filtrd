import { withTenant } from "./db";
import type { Job, Org } from "./types";

/** A job as candidates see it: live only, and without the screening configuration. */
export async function getPublicJob(org: Org, jobId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return null;
  const [job] = await withTenant(org.id, (tx) => tx<Pick<Job, "id" | "title" | "department" | "location" | "workplace" | "employmentType" | "experienceMin" | "experienceMax" | "salaryRange" | "description" | "requiredSkills" | "niceSkills" | "closesAt">[]>`
    select id, title, department, location, workplace, employment_type, experience_min, experience_max,
      salary_range, description, required_skills, nice_skills, closes_at
    from jobs where id = ${jobId} and status = 'published' and closes_at > now()`);
  return job ?? null;
}
