import { getSession, requireOrg } from "@/lib/auth";
import { withTenant } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });
  const { org } = await requireOrg();
  const { id } = await params;

  const resume = await withTenant(org.id, async (tx) => {
    const [row] = await tx<{ filename: string; contentType: string; data: Uint8Array }[]>`
      select filename, content_type, data from resumes where application_id = ${id}::uuid`;
    return row;
  });
  if (!resume) return new Response("Not found", { status: 404 });

  // Applicant files are untrusted, so they're always downloaded and never rendered on our origin.
  const filename = resume.filename.replace(/[^\w.\- ]+/g, "_");
  return new Response(Buffer.from(resume.data), {
    headers: {
      "Content-Type": resume.contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
