import { withTenant, type Tx } from "./db";

export function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Wraps already-escaped body HTML in the shared white, rounded email layout. */
export function layout(orgName: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111">
<div style="max-width:640px;margin:0 auto;padding:32px 20px">
<div style="font-size:14px;font-weight:600;margin-bottom:24px">${esc(orgName)}</div>
<div style="border:1px solid #ececec;border-radius:20px;padding:28px;font-size:14px;line-height:1.6">${body}</div>
<div style="font-size:12px;color:#8a8a8a;margin-top:20px">Sent by Filtrd on behalf of ${esc(orgName)}</div>
</div></body></html>`;
}

export function button(href: string, label: string) {
  return `<a href="${esc(href)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 20px;border-radius:12px;font-weight:500">${esc(label)}</a>`;
}

/** Queues inside the caller's transaction, so the email exists only if the state change commits. */
export async function queueEmail(
  tx: Tx,
  orgId: string,
  email: { kind: string; to: string[]; subject: string; html: string },
) {
  await tx`
    insert into emails (org_id, kind, to_addrs, subject, html)
    values (${orgId}, ${email.kind}, ${email.to}, ${email.subject}, ${email.html})`;
}

async function createTransport() {
  if (!process.env.SMTP_HOST) return null;
  const nodemailer = await import("nodemailer");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

/** Delivers queued mail for one tenant. Without SMTP it's marked captured and stays viewable in the app. */
export async function flushEmails(orgId: string) {
  const transport = await createTransport();
  const from = process.env.MAIL_FROM || "Filtrd <no-reply@example.com>";

  for (;;) {
    const more = await withTenant(orgId, async (tx) => {
      const [email] = await tx<{ id: string; toAddrs: string[]; subject: string; html: string }[]>`
        select id, to_addrs, subject, html from emails
        where status = 'queued' and attempts < 5
        order by created_at limit 1 for update skip locked`;
      if (!email) return false;
      if (!transport) {
        await tx`update emails set status = 'captured', sent_at = now() where id = ${email.id}`;
        return true;
      }
      try {
        await transport.sendMail({ from, to: email.toAddrs, subject: email.subject, html: email.html });
        await tx`update emails set status = 'sent', sent_at = now(), error = null where id = ${email.id}`;
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await tx`
          update emails set attempts = attempts + 1, error = ${message},
            status = case when attempts + 1 >= 5 then 'failed' else 'queued' end
          where id = ${email.id}`;
        return false; // Leave the rest for the next tick rather than hammering a broken server.
      }
    });
    if (!more) return;
  }
}

