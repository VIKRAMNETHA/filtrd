import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/display";
import { requireOrg } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import type { EmailRow } from "@/lib/types";

export const metadata: Metadata = { title: "Email" };

export default async function EmailPage({ params }: { params: Promise<{ id: string }> }) {
  const { org } = await requireOrg();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [email] = await withTenant(org.id, (tx) => tx<EmailRow[]>`select * from emails where id = ${id}`);
  if (!email) notFound();

  return (
    <>
      <Link href="/emails" className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft size={14} /> Emails
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">{email.subject}</h1>
      <p className="mb-5 mt-1 text-sm text-muted">To {email.toAddrs.join(", ")}</p>
      {email.error && <p className="mb-5 rounded-control bg-red-50 px-4 py-3 text-[13px] text-red-700">{email.error}</p>}
      <Card className="overflow-hidden">
        {/* Empty sandbox: the HTML includes applicant-supplied text, so it can't run or navigate. */}
        <iframe title="Email content" sandbox="" srcDoc={email.html} className="h-[640px] w-full" />
      </Card>
    </>
  );
}
