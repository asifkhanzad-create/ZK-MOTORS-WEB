import { cn } from "@/lib/utils";
import type { VehicleStatus } from "@/types/vehicle";

/**
 * Status pill for a vehicle. Status is always communicated by text as well as
 * colour, so it never depends on colour perception alone.
 */
const statusStyles: Record<
  VehicleStatus,
  { label: string; className: string; dot: string }
> = {
  available: {
    label: "Available",
    className: "bg-status-available/12 text-status-available border-status-available/30",
    dot: "bg-status-available",
  },
  reserved: {
    label: "Reserved",
    className: "bg-signal-500/14 text-signal-300 border-signal-500/35",
    dot: "bg-signal-400",
  },
  sold: {
    label: "Sold",
    /* Sits over vehicle photography, so the scrim is kept heavier than the
       other two — the charcoal base was lightened and /70 no longer holds
       contrast against a bright photo. */
    className: "bg-ink-950/85 text-bone-200 border-bone-50/20",
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
