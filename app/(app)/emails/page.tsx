import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, EmptyState, formatDate, PageHeader } from "@/components/display";
import { requireOrg } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import type { EmailRow } from "@/lib/types";

export const metadata: Metadata = { title: "Emails" };

const STATUS = {
  sent: { label: "Sent", tone: "green" },
  captured: { label: "Not delivered", tone: "amber" },
  queued: { label: "Queued", tone: "neutral" },
  failed: { label: "Failed", tone: "red" },
} as const;

export default async function EmailsPage() {
  const { org } = await requireOrg();
  const emails = await withTenant(org.id, (tx) => tx<EmailRow[]>`
    select id, kind, to_addrs, subject, status, error, created_at, sent_at from emails order by created_at desc limit 200`);
  const smtp = Boolean(process.env.SMTP_HOST);

  return (
    <>
      <PageHeader title="Emails" description="Everything Filtrd has sent for your organization." />
      {!smtp && (
        <p className="mb-5 rounded-control bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800">
          Email delivery isn&apos;t set up yet, so messages are kept here and not delivered. Set SMTP_HOST to start sending.
        </p>
      )}
      {emails.length === 0 ? (
        <EmptyState title="No emails yet" description="Shortlist reports and candidate updates appear here." />
      ) : (
        <Card className="divide-y divide-line">
          {emails.map((email) => (
            <Link key={email.id} href={`/emails/${email.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 first:rounded-t-card last:rounded-b-card hover:bg-wash/60">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{email.subject}</p>
                <p className="truncate text-[13px] text-muted">To {email.toAddrs.join(", ")} · {formatDate(email.createdAt)}</p>
              </div>
              <Badge tone={STATUS[email.status].tone}>{STATUS[email.status].label}</Badge>
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
