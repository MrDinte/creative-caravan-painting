import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { StaffManager } from "@/components/StaffManager";
import { listStaff } from "@/lib/db";

export const metadata: Metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
};

export default async function StaffPage() {
  const staff = await listStaff();

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
        Staff
      </h1>
      <p className="mt-1 text-slate-600">
        Everyone who can be allocated work. Active team members appear in the
        job and task allocation dropdowns.
      </p>

      <Card className="mt-6 p-6">
        <StaffManager staff={staff} />
      </Card>
    </div>
  );
}
