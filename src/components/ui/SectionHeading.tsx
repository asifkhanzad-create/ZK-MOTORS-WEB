import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Eyebrow + title + supporting line.
 * `tone` switches the palette for light vs dark sections so the same
 * component keeps hierarchy consistent everywhere.
 *
 * `accent` picks which of the two accents the eyebrow carries. `"accent"` is
 * the default because it is the buying path; the selling path is red, so
 * `/sell-your-car` passes `accent="signal"`. Without this the eyebrow was
 * hardcoded to the blue and the sell page read as browsing rather than selling.
 *
 * The values name the token families, not the hues. They used to read
 * `"cobalt" | "signal"`, and "cobalt" became a lie the moment the accent moved
 * to #4cc2ff. `accent-*` and `signal-*` are the durable names — pick a hue name
 * and it goes stale the next time the palette moves.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "dark",
  accent = "accent",
  align = "left",
  as: Tag = "h2",
  className,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: "dark" | "light";
  accent?: "accent" | "signal";
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
  children?: ReactNode;
}) {
  const isDark = tone === "dark";

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-eyebrow",
            accent === "signal"
              ? isDark
                ? "text-signal-300"
                : "text-signal-700"
              : isDark
                ? "text-accent-300"
                : "text-accent-700",
          )}
        >
          {eyebrow}
        </p>
      ) : null}

      <Tag
        className={cn(
          "text-3xl sm:text-4xl lg:text-[2.75rem]",
          isDark ? "text-bone-50" : "text-ink-950",
        )}
      >
        {title}
      </Tag>

      {description ? (
        <p
          className={cn(
            "max-w-2xl text-base sm:text-[1.0625rem]",
            align === "center" && "mx-auto",
            isDark ? "text-muted-dark" : "text-muted-light",
          )}
        >
          {description}
        </p>
      ) : null}

      {children}
    </div>
  );
}
