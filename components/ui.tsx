"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";
import { buttonClass, cx, type ButtonVariant } from "./classes";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: "sm" | "md" }) {
  return <button type="button" {...props} className={cx(buttonClass(variant, size), className)} />;
}

/** Submit button that disables itself while its parent form's action is running. */
export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { pendingText?: string; variant?: ButtonVariant; size?: "sm" | "md" }) {
  const { pending } = useFormStatus();
  return (
    <button {...props} type="submit" disabled={pending || props.disabled} className={cx(buttonClass(variant, size), className)}>
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

const controlClass =
  "w-full rounded-control border border-line bg-white px-3.5 text-sm text-ink placeholder:text-subtle transition-colors focus:border-ink focus:outline-none";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cx(controlClass, "h-10", className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cx(controlClass, "py-2.5 leading-relaxed", className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cx(controlClass, "h-10 appearance-none bg-white", className)} />;
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-relaxed text-muted">{hint}</span>}
    </label>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-control bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {message}
    </p>
  );
}
