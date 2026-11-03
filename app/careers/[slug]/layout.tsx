import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { careerBase, getPublicOrg } from "@/lib/careers";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const org = await getPublicOrg((await params).slug);
  if (!org) return {};
  return {
    title: { default: `Careers at ${org.name}`, template: `%s · ${org.name}` },
    description: org.tagline ?? `Open roles at ${org.name}.`,
  };
}

export default async function CareerLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getPublicOrg(slug);
  if (!org) notFound();
  const base = await careerBase(org.slug);

  return (
    <div style={{ "--brand": org.brandColor } as React.CSSProperties} className="flex min-h-screen flex-col">
      <header className="mx-auto flex h-20 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link href={base || "/"} className="inline-flex min-w-0 items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-brand text-sm font-bold text-white">
            {org.name.charAt(0).toUpperCase()}
          </span>
          <span className="truncate">{org.name}</span>
        </Link>
        {org.website && (
          <a href={org.website} target="_blank" rel="noreferrer" className="shrink-0 text-sm text-muted hover:text-ink">Website</a>
        )}
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 sm:px-6">{children}</main>
      <footer className="py-8 text-center text-xs text-subtle">Powered by Hireflow</footer>
    </div>
  );
}
