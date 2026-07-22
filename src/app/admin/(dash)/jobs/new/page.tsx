import type { Metadata } from "next";
import Link from "next/link";
import { NewJobForm } from "@/components/NewJobForm";
import { listStaff, nextJobCode } from "@/lib/db";

export const metadata: Metadata = {
  title: "New Job",
  robots: { index: false, follow: false },
};

export default async function NewJobPage() {
  const [jobCode, staff] = await Promise.all([nextJobCode(), listStaff(true)]);

  return (
    <div className="max-w-2xl">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/admin/jobs" className="hover:text-brand">
          Jobs
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-slate-800">New job</span>
      </nav>

      <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-slate-900">
        Book in a new job
      </h1>
      <p className="mt-1 text-slate-600">
        The next job code will be{" "}
        <code className="font-mono font-semibold text-brand">{jobCode}</code>.
        A customer access code is generated automatically.
      </p>

      <div className="mt-6">
        <NewJobForm staff={staff} />
      </div>
    </div>
  );
}
