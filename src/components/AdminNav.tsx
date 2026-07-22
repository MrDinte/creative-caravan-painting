"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/calendar", label: "Calendar", icon: "📅" },
  { href: "/admin/jobs", label: "Jobs", icon: "🚐" },
  { href: "/admin/tasks", label: "Task Manager", icon: "✅" },
  { href: "/admin/quotes", label: "Quotes", icon: "🧾" },
  { href: "/admin/prices", label: "Price Book", icon: "💲" },
  { href: "/admin/staff", label: "Staff", icon: "👷" },
  { href: "/admin/enquiries", label: "Enquiries", icon: "📥" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {links.map((l) => {
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
