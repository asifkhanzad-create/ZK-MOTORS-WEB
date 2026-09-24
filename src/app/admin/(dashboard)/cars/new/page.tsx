import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { VehicleForm } from "@/components/admin/VehicleForm";
import { EMPTY_VEHICLE_FORM } from "@/lib/vehicle-form";

export const metadata: Metadata = {
  title: "Add a car",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * A new listing.
 *
 * No auth check here — the `(dashboard)` layout above runs `requireAdmin()`
 * before this renders. The Server Action it posts to checks again, because an
 * action is reachable without ever rendering a page.
 */
export default function NewCarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-light transition-colors hover:text-ink-900"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Stock
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-950">Add a car</h1>
        <p className="mt-1 text-sm text-muted-light">
          It goes live as soon as you save, unless you untick “Show on the website”.
        </p>
      </div>

      <VehicleForm mode="create" initialValues={EMPTY_VEHICLE_FORM} />
    </div>
  );
}
