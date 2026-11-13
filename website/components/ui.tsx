import type { ComponentProps, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const variants = {
  primary: "bg-ink text-white hover:bg-black/80",
  secondary: "border border-line bg-white text-ink hover:bg-wash",
  ghost: "text-muted hover:bg-wash hover:text-ink",
  danger: "border border-line bg-white text-red-600 hover:bg-red-50",
};
export type Variant = keyof typeof variants;

export const buttonClass = (variant: Variant = "primary", size: "sm" | "md" | "lg" = "md") =>
  cx(
    "inline-flex items-center justify-center gap-1.5 rounded-control font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45",
    size === "lg" ? "h-12 px-6 text-[15px]" : size === "md" ? "h-10 px-4 text-sm" : "h-8 px-3 text-[13px]",
    variants[variant],
  );

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return <button type="button" {...props} className={cx(buttonClass(variant, size), className)} />;
}

const control =
  "w-full rounded-control border border-line bg-white px-3.5 text-sm text-ink placeholder:text-subtle transition-colors focus:border-ink focus:outline-none";
export const Input = ({ className, ...p }: ComponentProps<"input">) => <input {...p} className={cx(control, "h-10", className)} />;
export const Textarea = ({ className, ...p }: ComponentProps<"textarea">) => <textarea {...p} className={cx(control, "py-2.5 leading-relaxed", className)} />;
export const Select = ({ className, ...p }: ComponentProps<"select">) => <select {...p} className={cx(control, "h-10 bg-white", className)} />;

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-relaxed text-muted">{hint}</span>}
    </label>
  );
}

const tones = {
  neutral: "bg-wash text-muted",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-sky-50 text-sky-700",
  red: "bg-red-50 text-red-700",
  ink: "bg-ink text-white",
};
export type Tone = keyof typeof tones;

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-card border border-line bg-white", className)}>{children}</div>;
}

export function ScorePill({ score, threshold }: { score: number; threshold?: number }) {
  const passes = threshold == null || score >= threshold;
  return (
    <span className={cx("inline-flex h-6 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums", passes ? "bg-ink text-white" : "bg-wash text-muted")}>
      {score}
    </span>
  );
}
