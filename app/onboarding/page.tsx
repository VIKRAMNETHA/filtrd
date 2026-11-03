import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { withUser } from "@/lib/db";
import { Logo } from "@/components/logo";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export const metadata: Metadata = { title: "Set up your organization" };

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const memberships = await withUser(user.id, (tx) => tx`select 1 from memberships where user_id = ${user.id}`);
  if (memberships.length) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-10"><Logo /></div>
      <OnboardingWizard userEmail={user.email} rootDomain={process.env.ROOT_DOMAIN ?? "localhost:3000"} />
    </main>
  );
}
