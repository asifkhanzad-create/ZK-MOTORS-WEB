import { cn } from "@/lib/utils";

/**
 * Temporary ZK Motors wordmark.
 * Swap the mark for the real logo file when it is available — everything else
 * on the site references this one component.
 *
 * The monogram gradient must stay in step with make_mark() in
 * scripts/generate_brand_assets.py so the header mark and the favicon match.
 * It stops at accent-500 rather than accent-600 because the dark ink monogram
 * only holds contrast down to that point.
 */
export function Wordmark({
  className,
  tone = "dark",
  showTagline = true,
}: {
  className?: string;
  tone?: "dark" | "light";
  showTagline?: boolean;
}) {
  const isDark = tone === "dark";

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-[0.6rem] bg-gradient-to-br from-accent-300 to-accent-500 font-display text-[0.8125rem] font-extrabold tracking-tight text-ink-950 shadow-[0_2px_10px_-2px_rgba(76,194,255,0.5)]"
      >
        ZK
      </span>

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.0625rem] font-bold tracking-tight",
            isDark ? "text-bone-50" : "text-ink-950",
          )}
        >
          ZK Motors
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-1 hidden text-[0.625rem] font-semibold uppercase tracking-[0.14em] sm:block",
              isDark ? "text-ink-400" : "text-muted-light",
            )}
          >
            Used Cars · Wah Cantt
          </span>
        ) : null}
      </span>
    </span>
  );
}
