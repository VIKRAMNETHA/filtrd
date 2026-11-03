import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-center text-2xl font-semibold tracking-tight">Set up hiring for your team</h1>
      <p className="mb-6 mt-1.5 text-center text-sm text-muted">Your career site can be live in a few minutes.</p>
      <AuthForm mode="signup" />
    </>
  );
}
