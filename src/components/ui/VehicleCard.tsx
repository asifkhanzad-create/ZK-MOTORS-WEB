import { Fuel, Gauge, MapPin, MessageCircle, Settings2 } from "lucide-react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { buttonClasses } from "@/components/ui/Button";
import { formatMileage, formatPKR, vehicleTitle } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl, vehicleEnquiryMessage } from "@/lib/whatsapp";
import type { Vehicle } from "@/types/vehicle";

/** One icon + value pair in the spec strip. */
function Spec({
  icon: Icon,
  children,
}: {
  icon: typeof Gauge;
  children: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Icon aria-hidden="true" className="size-4 text-ink-400" />
      <span className="truncate text-[0.8125rem] font-medium text-bone-200">
        {children}
      </span>
    </div>
  );
}

const CARD_IMAGE_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

/**
 * Reusable vehicle card used by both "Featured cars" and "Recently sold".
 * Sold vehicles are visually quieter and drop the enquiry action.
 */
export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const isSold = vehicle.status === "sold";
  const title = vehicleTitle(vehicle);
  const whatsappUrl = buildWhatsAppUrl(vehicleEnquiryMessage(vehicle));

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card border bg-ink-900",
        "transition-colors duration-200",
        isSold ? "border-ink-800/70" : "border-ink-800 hover:border-ink-600",
      )}
    >
      <div className="relative">
        <VehicleImage
          src={vehicle.image}
          alt={vehicle.imageAlt}
          sizes={CARD_IMAGE_SIZES}
          imgClassName={isSold ? "saturate-[0.55] opacity-85" : undefined}
        />

        <div className="absolute left-3 top-3">
          <StatusBadge status={vehicle.status} />
        </div>

        <div className="absolute right-3 top-3 rounded-full border border-bone-50/15 bg-ink-950/70 px-2.5 py-1 text-[0.6875rem] font-semibold text-bone-100 backdrop-blur-sm">
          {vehicle.year}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg text-bone-50">{title}</h3>
          <p className="flex items-center gap-1.5 text-[0.8125rem] text-muted-dark">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">
              {vehicle.bodyType} · Registered in {vehicle.registrationCity}
            </span>
          </p>
        </div>

        {vehicle.highlight && !isSold ? (
          <p className="text-[0.8125rem] leading-relaxed text-accent-200">
            {vehicle.highlight}
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-3 border-y border-ink-800 py-4">
          <Spec icon={Gauge}>{formatMileage(vehicle.mileage)}</Spec>
          <Spec icon={Settings2}>{vehicle.transmission}</Spec>
          <Spec icon={Fuel}>{vehicle.fuel}</Spec>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-eyebrow text-ink-400">
              {isSold ? "Sold for" : "Price"}
            </span>
            <span
              className={cn(
                "font-display text-xl font-semibold tracking-tight",
                isSold ? "text-muted-dark" : "text-bone-50",
              )}
            >
              {formatPKR(vehicle.price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/cars/${vehicle.id}`}
              className={buttonClasses({
                variant: isSold ? "outline" : "primary",
                size: "md",
                className: "flex-1",
              })}
            >
              View Details
            </a>

            {!isSold && whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Enquire about the ${title} on WhatsApp`}
                className={buttonClasses({
                  variant: "whatsapp",
                  size: "md",
                  className: "px-4",
                })}
              >
                <MessageCircle aria-hidden="true" className="size-5" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
