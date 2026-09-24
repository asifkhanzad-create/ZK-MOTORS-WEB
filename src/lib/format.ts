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

/**
 * Make a vehicle image path absolute, for structured data and Open Graph.
 *
 * Stock images live in Supabase Storage now, so `vehicle.image` is already an
 * absolute URL. Concatenating the site URL onto it — which is what the schema
 * markup did when images were local `/vehicles/...` paths — produced
 * `https://zkmotors.pkhttps://wlwnf.../bmw-x3.jpg`. A search engine would
 * silently drop the image rather than complain, so this is worth a helper
 * rather than a template literal at each call site.
 *
 * Relative paths are still handled, because a placeholder or a future
 * self-hosted photo could legitimately be one.
 */
export function absoluteImageUrl(image: string, base: string): string {
  if (/^https?:\/\//i.test(image)) return image;
  return `${base}${image.startsWith("/") ? "" : "/"}${image}`;
}
