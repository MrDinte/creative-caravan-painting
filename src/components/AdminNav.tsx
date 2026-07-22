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
  { href: "/admin/invoices", label: "Invoices", icon: "💳", adminOnly: true },
  { href: "/admin/stock", label: "Stock", icon: "📦", adminOnly: false },
  { href: "/admin/suppliers", label: "Suppliers", icon: "🚚", adminOnly: true },
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
            className={`flex min-h-[44px] shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              active
                ? "bg-brand-solid text-white shadow-[0_2px_8px_rgb(13_114_104_/_0.25)]"
                : "text-slate-600 hover:bg-[var(--surface)] hover:text-slate-900 hover:shadow-[0_1px_3px_rgb(15_23_42_/_0.08)]"
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
