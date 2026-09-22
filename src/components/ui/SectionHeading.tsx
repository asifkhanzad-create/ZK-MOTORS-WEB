import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Eyebrow + title + supporting line.
 * `tone` switches the palette for light vs dark sections so the same
 * component keeps hierarchy consistent everywhere.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "dark",
  align = "left",
  as: Tag = "h2",
  className,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: "dark" | "light";
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
            isDark ? "text-accent-300" : "text-accent-700",
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
