import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  deleteVehicle,
  setVehicleStatus,
  toggleFeatured,
  togglePublished,
} from "@/app/admin/vehicle-actions";
import { VehicleRowActions } from "@/components/admin/VehicleRowActions";
import { buttonClasses } from "@/components/ui/Button";
import { fetchAdminVehicles } from "@/lib/admin-vehicles";
import { formatMileage, formatPKR, vehicleTitle } from "@/lib/format";
import type { AdminVehicle } from "@/types/vehicle";

export const metadata: Metadata = {
  title: "Stock",
  robots: { index: false, follow: false, nocache: true },
};

/** The three outcomes a redirect back from an action can carry. */
type Flash = { kind: "saved" | "deleted" | "error"; text: string };

function readFlash(params: Record<string, string | string[] | undefined>): Flash | null {
  const first = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : null;
  };

  const saved = first("saved");
  if (saved) return { kind: "saved", text: `Saved “${saved}”.` };

  const deleted = first("deleted");
  if (deleted) return { kind: "deleted", text: `Deleted “${deleted}”.` };

  const error = first("error");
  if (error) return { kind: "error", text: error };

  return null;
}

function DraftBadge() {
  return (
    <span className="rounded-full border border-bone-300 bg-bone-100 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-light">
      Draft
    </span>
  );
}

function StatusPill({ status }: { status: AdminVehicle["status"] }) {
  /* Colour is doing real work here: red is the site's "needs attention" ramp, so
     a sold car is the one that reads as finished at a glance. */
  const tone =
    status === "sold"
      ? "border-signal-200 bg-signal-200/40 text-signal-700"
      : status === "reserved"
        ? "border-accent-200 bg-accent-200/40 text-accent-700"
        : "border-bone-300 bg-white text-ink-700";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.1em] ${tone}`}
    >
      {status}
    </span>
  );
}

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, vehicles] = await Promise.all([searchParams, fetchAdminVehicles()]);
  const flash = readFlash(params);

  const published = vehicles.filter((vehicle) => vehicle.published).length;
  const drafts = vehicles.length - published;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-950">Stock</h1>
          <p className="mt-1 text-sm text-muted-light">
            {vehicles.length} {vehicles.length === 1 ? "car" : "cars"}
            {drafts > 0 ? ` · ${drafts} draft${drafts === 1 ? "" : "s"}` : ""}
            {" · "}
            {published} live on the site
          </p>
        </div>

        <Link href="/admin/cars/new" className={buttonClasses({ variant: "primary", size: "md" })}>
          <Plus aria-hidden="true" className="size-4" />
          Add a car
        </Link>
      </div>

      {flash ? (
        <p
          role="status"
          className={`rounded-2xl border p-4 text-sm ${
            flash.kind === "error"
              ? "border-signal-200 bg-signal-200/25 text-ink-900"
              : "border-bone-200 bg-white text-ink-900"
          }`}
        >
          {flash.text}
        </p>
      ) : null}

      {vehicles.length === 0 ? (
        <div className="rounded-card border border-bone-200 bg-white p-8 text-center">
          <p className="font-semibold text-ink-950">No cars yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-light">
            Add the first listing and it will appear on the website straight away.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-card border border-bone-200 bg-white">
          {vehicles.map((vehicle) => (
            <li
              key={vehicle.id}
              className="grid grid-cols-1 gap-4 border-b border-bone-200 p-4 last:border-b-0 lg:grid-cols-[auto_1fr_auto] lg:items-center"
            >
              <Image
                src={vehicle.image}
                alt=""
                width={112}
                height={84}
                sizes="112px"
                /* Empty alt on purpose: the title beside it already names the car,
                   so describing the photo again would just repeat it. */
                className="h-[84px] w-[112px] rounded-lg object-cover"
              />

              <div className="min-w-0">
                <p className="font-semibold text-ink-950">
                  {vehicleTitle(vehicle)}
                </p>
                <p className="mt-0.5 text-sm text-muted-light">
                  {vehicle.year} · {formatMileage(vehicle.mileage)} ·{" "}
                  {vehicle.registrationCity}
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-ink-900">
                  {formatPKR(vehicle.price)}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusPill status={vehicle.status} />
                  {!vehicle.published ? <DraftBadge /> : null}
                  {vehicle.featured ? (
                    <span className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-accent-700">
                      Featured
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <Link
                  href={`/admin/cars/${vehicle.id}`}
                  className={buttonClasses({ variant: "outlineLight", size: "sm" })}
                >
                  Edit
                </Link>

                <VehicleRowActions
                  id={vehicle.id}
                  status={vehicle.status}
                  published={vehicle.published}
                  featured={Boolean(vehicle.featured)}
                  actions={{
                    setStatus: setVehicleStatus,
                    togglePublished,
                    toggleFeatured,
                    remove: deleteVehicle,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
