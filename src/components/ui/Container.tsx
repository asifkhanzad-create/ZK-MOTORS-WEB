import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Single source of truth for horizontal rhythm.
 * Every section uses this so gutters line up across the whole page.
 */
export function Container({
  children,
  className,
  as: Tag = "div",
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  size?: "default" | "wide" | "narrow";
}) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-5 sm:px-6 lg:px-8",
        size === "default" && "max-w-7xl",
        size === "wide" && "max-w-[90rem]",
        size === "narrow" && "max-w-3xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
