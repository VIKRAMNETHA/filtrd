"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signupAction } from "@/app/_actions/auth";
import type { FormState } from "@/lib/types";
import { Field, FormError, Input, SubmitButton } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action] = useActionState<FormState, FormData>(mode === "login" ? loginAction : signupAction, {});
  const isSignup = mode === "signup";
  return (
    <form action={action} className="space-y-4">
      {isSignup && (
        <Field label="Full name">
          <Input name="name" required autoComplete="name" placeholder="Priya Sharma" />
        </Field>
      )}
      <Field label="Work email">
        <Input name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
      </Field>
      <Field label="Password" hint={isSignup ? "At least 10 characters." : undefined}>
        <Input
          name="password"
          type="password"
          required
          minLength={isSignup ? 10 : undefined}
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
      </Field>
      <FormError message={state.error} />
      <SubmitButton className="w-full" pendingText={isSignup ? "Creating account…" : "Signing in…"}>
        {isSignup ? "Create account" : "Sign in"}
      </SubmitButton>
      <p className="pt-1 text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New to Filtrd? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-ink hover:underline">
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
