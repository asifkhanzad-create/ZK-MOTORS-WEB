import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { VehicleForm } from "@/components/admin/VehicleForm";
import { buttonClasses } from "@/components/ui/Button";
import { fetchAdminVehicle } from "@/lib/admin-vehicles";
import { vehicleToFormValues } from "@/lib/vehicle-form";

/**
 * `noindex` and a title that stays generic: a listing id in a `<title>` would be
 * meaningless, and the id is already in the URL.
 */
export const metadata: Metadata = {
  title: "Edit a car",
  robots: { index: false, follow: false, nocache: true },
};

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await fetchAdminVehicle(id);

  /* Handled inline rather than with `notFound()`. `notFound()` unwinds to the
     nearest `not-found.tsx`, which is the marketing site's — the admin chrome
     would vanish and the operator would be dropped into the shop's 404 page with
     no way back. A panel that keeps the header and the way out is more useful for
     what is usually a stale bookmark or a car that has just been deleted. */
  if (!vehicle) {
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
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-950">
            No car with that address
          </h1>
        </div>

        <div className="rounded-card border border-bone-200 bg-white p-8 text-center">
          <p className="font-semibold text-ink-950">
            <code className="rounded bg-bone-100 px-1.5 py-0.5 text-sm">{id}</code> is not in
            the stock list.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-light">
            It may have been deleted, or the link may be out of date. If you are
            sure it exists, check that the admin database policies from
            <code className="mx-1 rounded bg-bone-100 px-1.5 py-0.5 text-xs">
              0002_admin_access.sql
            </code>
            have been run — without them, drafts are invisible here.
          </p>
          <Link
            href="/admin"
            className={buttonClasses({ variant: "primary", size: "md", className: "mt-5" })}
          >
            Back to stock
          </Link>
        </div>
      </div>
    );
  }

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
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-950">
          {vehicle.make} {vehicle.model}
          {vehicle.variant ? ` ${vehicle.variant}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-light">
          {vehicle.published ? "Live on the site" : "Draft — hidden from visitors"}
        </p>
      </div>

      <VehicleForm
        mode="edit"
        initialValues={vehicleToFormValues(vehicle)}
        currentImage={vehicle.image}
      />
    </div>
  );
}
