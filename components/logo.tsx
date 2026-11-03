import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight">
      <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-ink text-[13px] font-bold text-white">H</span>
      Hireflow
    </Link>
  );
}
