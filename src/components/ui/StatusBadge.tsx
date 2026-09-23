import { cn } from "@/lib/utils";
import type { VehicleStatus } from "@/types/vehicle";

/**
 * Status pill for a vehicle. Status is always communicated by text as well as
 * colour, so it never depends on colour perception alone.
 *
 * Every badge sits on top of vehicle photography, so it has to carry its own
 * background rather than borrowing the photo's. The original tinted chips
 * (`bg-status-available/12`) only shifted the backdrop by 12%, which measured
 * **1.33:1** where the badge overlapped the bright sky in the Prado photo —
 * against a 4.5:1 requirement for 11px text. The scrim is now 95% ink-950,
 * which composites to #2f2f2f over a pure-white photo pixel and clears 4.5:1
 * for all three labels. The worst case is a white car or an overcast sky, so
 * "over a white pixel" is the bar, not "over the average photo".
 *
 * The alpha is checked in `scripts/verify_theme.py`. If you lighten it, re-run
 * that script — the badge is the one element on the site whose backdrop this
 * codebase cannot control.
 *
 * The alpha was raised 90% -> 95% when the base went #181b21 -> #242424. The
 * scrim is a *derived* colour: 90% of a lighter ink composites lighter, and the
 * `sold` label fell to 4.51:1 — technically passing, with no margin left. The
 * percentage is part of the palette, not an independent styling choice.
 */
const statusStyles: Record<
  VehicleStatus,
  { label: string; className: string; dot: string }
> = {
  available: {
    label: "Available",
    className: "bg-ink-950/95 text-status-available border-status-available/40",
    dot: "bg-status-available",
  },
  reserved: {
    label: "Reserved",
    className: "bg-ink-950/95 text-signal-300 border-signal-500/45",
    dot: "bg-signal-400",
  },
  sold: {
    label: "Sold",
    className: "bg-ink-950/95 text-bone-200 border-bone-50/20",
    dot: "bg-status-sold",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: VehicleStatus;
  className?: string;
}) {
  const style = statusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        "text-[0.6875rem] font-semibold uppercase tracking-wider backdrop-blur-sm",
        style.className,
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  );
}
