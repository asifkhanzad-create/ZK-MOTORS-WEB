import { StatusBadge } from "@/components/ui/StatusBadge";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { formatPKR, vehicleTitle } from "@/lib/format";
import type { Vehicle } from "@/types/vehicle";

const CARD_IMAGE_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw";

/**
 * Compact card for the "Recently sold" strip.
 *
 * Intentionally different from VehicleCard: no enquiry actions (the car is
 * gone), muted photography, and a visible Sold badge so these can never be
 * mistaken for available stock.
 */
export function SoldVehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-ink-800 bg-ink-900">
      <div className="relative">
        <VehicleImage
          src={vehicle.image}
          alt={vehicle.imageAlt}
          sizes={CARD_IMAGE_SIZES}
          aspect="aspect-[16/10]"
          imgClassName="saturate-[0.45] opacity-80"
        />
        <div className="absolute left-3 top-3">
          <StatusBadge status="sold" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base text-bone-100">
          {vehicleTitle(vehicle)}
        </h3>
        <p className="text-[0.8125rem] text-ink-400">
          {vehicle.year} · {vehicle.registrationCity}
        </p>
        <p className="mt-auto pt-2 font-display text-base font-semibold text-muted-dark">
          {formatPKR(vehicle.price)}
        </p>
      </div>
    </article>
  );
}
