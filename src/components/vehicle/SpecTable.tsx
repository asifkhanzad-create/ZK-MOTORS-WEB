import { vehicleSpecs } from "@/lib/vehicle";
import type { Vehicle } from "@/types/vehicle";

/**
 * The car's facts, in a definition list.
 *
 * Two columns from `sm` up so eight rows do not become an eight-row ladder on
 * a laptop. `<dl>` rather than a table: this is a set of label/value pairs, not
 * tabular data, and it reads correctly to a screen reader without any ARIA.
 */
export function SpecTable({ vehicle }: { vehicle: Vehicle }) {
  const rows = vehicleSpecs(vehicle);

  return (
    <dl className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-6 border-b border-ink-800 py-3"
        >
          <dt className="text-[0.8125rem] text-muted-dark">{row.label}</dt>
          <dd className="text-right text-[0.9375rem] font-medium text-bone-50">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
