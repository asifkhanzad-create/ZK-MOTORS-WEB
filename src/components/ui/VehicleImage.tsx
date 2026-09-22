"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Vehicle photo with a graceful fallback.
 *
 * Every card uses the same fixed aspect ratio so mixed source photos can never
 * break the grid, and a missing/broken file degrades to a branded panel instead
 * of a broken-image icon.
 */
export function VehicleImage({
  src,
  alt,
  sizes,
  aspect = "aspect-[4/3]",
  className,
  imgClassName,
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  aspect?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-ink-850", aspect, className)}>
      {failed ? (
        <div
          role="img"
          aria-label={`${alt} (photo unavailable)`}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-800 to-ink-900 text-ink-400"
        >
          <ImageOff aria-hidden="true" className="size-6" />
          <span className="text-xs font-medium tracking-wide">
            Photo coming soon
          </span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className={cn(
            "object-cover transition-transform duration-500 ease-out",
            "group-hover:scale-[1.03] motion-reduce:transform-none",
            imgClassName,
          )}
        />
      )}
    </div>
  );
}
