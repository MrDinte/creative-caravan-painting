"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AccessLevel } from "@/lib/types";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊", adminOnly: false },
  { href: "/admin/calendar", label: "Calendar", icon: "📅", adminOnly: false },
  { href: "/admin/jobs", label: "Jobs", icon: "🚐", adminOnly: false },
  { href: "/admin/tasks", label: "Task Manager", icon: "✅", adminOnly: false },
  { href: "/admin/timesheets", label: "Timesheets", icon: "⏱️", adminOnly: false },
  { href: "/admin/quotes", label: "Quotes", icon: "🧾", adminOnly: true },
  { href: "/admin/prices", label: "Price Book", icon: "💲", adminOnly: true },
  { href: "/admin/staff", label: "Staff", icon: "👷", adminOnly: true },
  { href: "/admin/enquiries", label: "Enquiries", icon: "📥", adminOnly: true },
];

export function AdminNav({ accessLevel }: { accessLevel: AccessLevel }) {
  const pathname = usePathname();
  const visible = links.filter((l) => accessLevel === "admin" || !l.adminOnly);

  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {visible.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span aria-hidden>{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
