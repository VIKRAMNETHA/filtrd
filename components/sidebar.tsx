"use client";

import { Briefcase, ExternalLink, LayoutGrid, LogOut, Mail, Menu, Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/_actions/auth";
import { cx } from "./classes";
import { Logo } from "./logo";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/emails", label: "Emails", icon: Mail },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ orgName, userName, careerUrl }: { orgName: string; userName: string; careerUrl: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-line px-4 lg:hidden">
        <Logo href="/dashboard" />
        <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-9 w-9 place-items-center rounded-control hover:bg-wash">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <aside className={cx("flex-col border-r border-line bg-white px-3 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0", open ? "flex" : "hidden")}>
        <div className="mb-6 hidden px-2.5 lg:block">
          <Logo href="/dashboard" />
        </div>
        <div className="mb-5 px-2.5">
          <p className="truncate text-[13px] font-medium">{orgName}</p>
        </div>
        <nav className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-sm transition-colors",
                  active ? "bg-wash font-medium text-ink" : "text-muted hover:bg-wash hover:text-ink",
                )}
              >
                <Icon size={16} strokeWidth={1.75} /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 space-y-0.5 lg:mt-auto">
          <a href={careerUrl} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-sm text-muted hover:bg-wash hover:text-ink">
            <ExternalLink size={16} strokeWidth={1.75} /> Career site
          </a>
          <form action={logoutAction}>
            <button className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-sm text-muted hover:bg-wash hover:text-ink">
              <LogOut size={16} strokeWidth={1.75} />
              <span className="truncate">Sign out {userName.split(" ")[0]}</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
