import { MapPin } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Stylised stand-in for the showroom map.
 *
 * There is no API key and no embed yet, so this draws a plausible street grid
 * in the site's own palette rather than shipping an empty grey box. It is
 * sized by the caller and deliberately keeps the same outer dimensions as a
 * Google Maps `<iframe>` would, so the embed can replace the children here
 * without the surrounding layout moving.
 *
 * `aria-hidden` is set on the decorative layers only — the caption below them
 * is real content and is announced.
 */
export function MapPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-ink-700 bg-ink-850",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-full w-24 -translate-x-1/2 bg-accent-500/8"
      />
      <div
        aria-hidden="true"
        className="absolute left-0 top-1/2 h-16 w-full -translate-y-1/2 bg-bone-50/5"
      />

      <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-accent-400 text-ink-950 shadow-[0_8px_24px_-6px_rgba(76,194,255,0.65)]">
          <MapPin aria-hidden="true" className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-display text-base font-semibold text-bone-50">
            {siteConfig.address.locality}, {siteConfig.address.region}
          </p>
          <p className="max-w-xs text-[0.8125rem] leading-relaxed text-muted-dark">
            {siteConfig.address.full}
          </p>
        </div>
      </div>
    </div>
  );
}
