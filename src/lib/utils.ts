/** Join conditional class names. Avoids pulling in clsx for one tiny helper. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
