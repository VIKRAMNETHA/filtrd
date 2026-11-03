export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Decides the file type from its bytes; the browser-supplied type and extension aren't trusted. */
export function detectResumeType(bytes: Uint8Array, filename: string): string | null {
  const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (isPdf) return "application/pdf";
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (isZip && filename.toLowerCase().endsWith(".docx")) return DOCX_TYPE;
  return null;
}

export async function extractResumeText(data: Uint8Array, contentType: string): Promise<string> {
  if (contentType === "application/pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(data));
    const { text } = await extractText(pdf, { mergePages: true });
    return text.trim();
  }
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(data) });
  return value.trim();
}
