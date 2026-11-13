import Link from "next/link";

// Funnel mark traced from the brand artwork. Uses currentColor.
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="510 335 515 425" width={size} height={size} aria-hidden="true" className={className} fill="currentColor">
      <path d="M550 353H987C1003 353 1013 372 1000 390L987 410H550L537 392C524 374 534 353 550 353Z" />
      <path d="M569 435L968 432L826 604C822 609 821 612 821 618V674C821 682 818 686 812 690L740 742C730 749 714 744 714 732V618C714 612 713 608 709 603Z" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight">
      <LogoMark size={26} />
      Filtrd
    </Link>
  );
}
