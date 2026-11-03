export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const buttonVariants = {
  primary: "bg-ink text-white hover:bg-black/80",
  secondary: "border border-line bg-white text-ink hover:bg-wash",
  ghost: "text-muted hover:bg-wash hover:text-ink",
  danger: "border border-line bg-white text-red-600 hover:bg-red-50",
};

export const buttonClass = (variant: ButtonVariant = "primary", size: "sm" | "md" = "md") =>
  cx(
    "inline-flex items-center justify-center gap-1.5 rounded-control font-medium transition-colors whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50",
    size === "md" ? "h-10 px-4 text-sm" : "h-8 px-3 text-[13px]",
    buttonVariants[variant],
  );

export type ButtonVariant = keyof typeof buttonVariants;
