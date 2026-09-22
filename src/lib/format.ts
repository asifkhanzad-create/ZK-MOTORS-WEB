/** Formatting helpers shared across the site. */

/**
 * Format a whole-rupee amount the way Pakistani dealerships list prices,
 * e.g. 5850000 -> "PKR 5,850,000".
 */
export function formatPKR(amount: number): string {
  return `PKR ${new Intl.NumberFormat("en-US").format(amount)}`;
}

/** e.g. 68000 -> "68,000 km" */
export function formatMileage(km: number): string {
  return `${new Intl.NumberFormat("en-US").format(km)} km`;
}

/** Build a "Make Model Variant" label without leaving stray spaces. */
export function vehicleTitle(parts: {
  make: string;
  model: string;
  variant?: string;
}): string {
  return [parts.make, parts.model, parts.variant].filter(Boolean).join(" ");
}

/**
 * Short price form used in dense UI such as the search panel, e.g.
 * 5850000 -> "58.5 lakh". Pakistani buyers commonly read prices this way.
 */
export function formatPKRShort(amount: number): string {
  if (amount >= 10_000_000) return `PKR ${(amount / 10_000_000).toFixed(2)} crore`;
  if (amount >= 100_000) return `PKR ${(amount / 100_000).toFixed(2)} lakh`;
  return formatPKR(amount);
}
