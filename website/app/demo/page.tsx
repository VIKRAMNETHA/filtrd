import type { Metadata } from "next";
import { DemoApp } from "@/components/demo/demo-app";

export const metadata: Metadata = {
  title: "Interactive demo",
  description: "Try Filtrd end to end: set up a company, post a role, watch resumes get scored, receive the shortlist, and ask the hiring agent.",
};

export default function DemoPage() {
  return <DemoApp />;
}
