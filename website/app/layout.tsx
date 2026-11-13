import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://filtrd.in"),
  title: { default: "Filtrd · Hiring on autopilot, decisions in your hands", template: "%s · Filtrd" },
  description:
    "Filtrd gives every company a branded career site, scores every resume the moment it arrives, and emails HR a shortlist when a role closes. Ask the hiring agent for anything in plain English.",
  openGraph: { title: "Filtrd", description: "Hiring on autopilot, decisions in your hands.", url: "https://filtrd.in", siteName: "Filtrd", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-ink">{children}</body>
    </html>
  );
}
