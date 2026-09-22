import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { directionsUrl, siteConfig } from "@/config/site";
import { formatPKR } from "@/lib/format";
import {
  buildWhatsAppUrl,
  soldVehicleEnquiryMessage,
  vehicleEnquiryMessage,
} from "@/lib/whatsapp";
import type { Vehicle } from "@/types/vehicle";

/**
 * The conversion surface of the detail page: price, the three ways to reach the
 * showroom, and the opening hours.
 *
 * Sticky on desktop so the price and the call button stay visible while the
 * photos and specs scroll past. That is the whole point of the layout — but it
 * also means the panel must stay shorter than the viewport, or `position:
 * sticky` pins its top and the bottom of the panel becomes unreachable. Keep
 * this component to price + actions + hours; anything longer belongs in the
 * main column. `qa/qa-detail.mjs` measures it.
 *
 * Sold cars get a deliberately different panel. Offering "enquire about this
 * car" on something that is gone wastes the visitor's time and the showroom's,
 * so the action becomes "ask for something similar" instead.
 */
export function EnquiryPanel({ vehicle }: { vehicle: Vehicle }) {
  const isSold = vehicle.status === "sold";

  const whatsappUrl = buildWhatsAppUrl(
    isSold ? soldVehicleEnquiryMessage(vehicle) : vehicleEnquiryMessage(vehicle),
  );

  return (
    <div className="flex flex-col gap-6 rounded-card border border-ink-800 bg-ink-900 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-eyebrow text-ink-400">
          {isSold ? "Sold for" : "Asking price"}
        </p>
        <p
          className={
            isSold
              ? "font-display text-3xl font-bold tracking-tight text-muted-dark"
              : "font-display text-3xl font-bold tracking-tight text-bone-50"
          }
        >
          {formatPKR(vehicle.price)}
        </p>
        {vehicle.highlight && !isSold ? (
          <p className="text-[0.8125rem] leading-relaxed text-accent-200">
            {vehicle.highlight}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {whatsappUrl ? (
          <Button
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="whatsapp"
            size="lg"
            className="w-full"
          >
            <MessageCircle aria-hidden="true" className="size-5" />
            {isSold ? "Ask for something similar" : "WhatsApp about this car"}
          </Button>
        ) : null}

        <Button
          href={`tel:${siteConfig.contact.phoneE164}`}
          variant="primary"
          size="lg"
          className="w-full"
        >
          <Phone aria-hidden="true" className="size-4" />
          Call {siteConfig.contact.phoneDisplay}
        </Button>

        <Button
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          size="lg"
          className="w-full"
        >
          <MapPin aria-hidden="true" className="size-4" />
          Get directions
        </Button>
      </div>

      <p className="flex items-start gap-2.5 border-t border-ink-800 pt-5 text-[0.8125rem] leading-relaxed text-muted-dark">
        <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-400" />
        <span>
          {siteConfig.hours.display}. {siteConfig.hours.note}.{" "}
          {siteConfig.address.full}.
        </span>
      </p>
    </div>
  );
}
