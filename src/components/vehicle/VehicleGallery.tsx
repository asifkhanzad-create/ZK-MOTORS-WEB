"use client";

import { Images } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { cn } from "@/lib/utils";
import type { VehicleStatus } from "@/types/vehicle";

const MAIN_SIZES = "(max-width: 1024px) 100vw, 58vw";
const THUMB_SIZES = "(max-width: 1024px) 25vw, 12vw";

export interface GalleryPhoto {
  src: string;
  alt: string;
}

/**
 * Main vehicle photo with an optional thumbnail rail.
 *
 * Every listing currently carries exactly one photo, so the single-photo state
 * is the one that ships today: the main image plus a line telling the visitor
 * to ask for the rest. The rail appears on its own as soon as a listing gains
 * entries in its `gallery` field — which is where Phase 5's real photography
 * will land.
 *
 * NOTE: the multi-photo branch has not been exercised against real data,
 * because no listing has a second photo yet. It is deliberately small and
 * state-free beyond the selected index.
 */
export function VehicleGallery({
  photos,
  status,
  year,
}: {
  photos: GalleryPhoto[];
  status: VehicleStatus;
  year: number;
}) {
  const [active, setActive] = useState(0);
  const current = photos[active] ?? photos[0];
  const hasMany = photos.length > 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <VehicleImage
          src={current.src}
          alt={current.alt}
          sizes={MAIN_SIZES}
          aspect="aspect-[16/10]"
          priority
        />

        <div className="absolute left-4 top-4">
          <StatusBadge status={status} />
        </div>

        <div className="absolute right-4 top-4 rounded-full border border-bone-50/15 bg-ink-950/70 px-3 py-1 text-xs font-semibold text-bone-100 backdrop-blur-sm">
          {year}
        </div>
      </div>

      {hasMany ? (
        <ul className="grid grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <li key={photo.src}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show photo ${index + 1} of ${photos.length}`}
                aria-current={index === active}
                className={cn(
                  "block w-full cursor-pointer overflow-hidden rounded-lg border-2 transition-colors duration-200",
                  index === active
                    ? "border-accent-400"
                    : "border-transparent hover:border-ink-500",
                )}
              >
                {/* The button carries the accessible name, so the image inside
                    is decorative and takes an empty alt. */}
                <VehicleImage
                  src={photo.src}
                  alt=""
                  sizes={THUMB_SIZES}
                  aspect="aspect-[4/3]"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        /* Not a placeholder for missing UI — an actual sales prompt. Interior,
           engine bay and close-ups of any marks are the photos buyers ask for
           next, and sending them is the cheapest way to earn the enquiry. */
        <p className="flex items-start gap-2.5 rounded-xl border border-ink-800 bg-ink-900 px-4 py-3 text-[0.8125rem] leading-relaxed text-muted-dark">
          <Images aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-400" />
          <span>
            One photo on file for this car. Message us and we will send the rest
            — interior, engine bay, and close-ups of any marks.
          </span>
        </p>
      )}
    </div>
  );
}
