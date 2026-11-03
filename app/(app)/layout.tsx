import { requireOrg } from "@/lib/auth";
import { careerSiteUrl } from "@/lib/urls";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { org, user } = await requireOrg();
  return (
    <div className="lg:flex">
      <Sidebar orgName={org.name} userName={user.name} careerUrl={careerSiteUrl(org.slug)} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
