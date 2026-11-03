import type { Metadata } from "next";
import { PageHeader } from "@/components/display";
import { SettingsForm } from "@/components/settings-form";
import { requireOrg } from "@/lib/auth";
import { careerSiteUrl } from "@/lib/urls";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { org, settings } = await requireOrg();
  return (
    <>
      <PageHeader title="Settings" description={`Career site: ${careerSiteUrl(org.slug).replace(/^https?:\/\//, "")}`} />
      <SettingsForm org={org} settings={settings} />
    </>
  );
}
