import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { shouldPrefetch } from "@/config/site";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "primarySignal"
  | "outline"
  | "outlineLight"
  | "outlineSignal"
  | "ghost"
  | "ghostLight"
  | "whatsapp";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "cursor-pointer select-none whitespace-nowrap " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

/*
 * Two accents, two jobs — this is the whole colour system in one place.
 *   accent-* (sky blue) = the buying path: browsing, primary calls to action
 *   signal-* (red)      = the selling path and anything that needs attention
 * The glows are literal rgba() rather than token reads, so they have to be
 * updated by hand whenever the accent ramp changes. They currently encode
 * accent-400 #4cc2ff = rgba(76,194,255). Search the repo for that triple
 * after any accent change — Button, Wordmark and MapPlaceholder each hold one.
 */
const variants: Record<ButtonVariant, string> = {
  /* Primary accent action. Reads correctly on both surfaces. */
  primary:
    "bg-accent-400 text-ink-950 hover:bg-accent-300 shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_8px_24px_-12px_rgba(76,194,255,0.65)]",
  /* Signal action — the sell/exchange path, where red carries the section.
     Deeper fill with white text rather than signal-400 with dark text: at the
     lighter weight the red read as salmon beside the WhatsApp green, and a
     deeper red is the more credible automotive tone. signal-500 on white is
     4.8:1, and the signal-600 hover is 7.0:1. */
  primarySignal:
    "bg-signal-500 text-white hover:bg-signal-600 shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset,0_8px_24px_-12px_rgba(201,68,56,0.55)]",
  /* Neutral action on dark surfaces. Border is ink-500 rather than ink-600:
     the charcoal base was lightened, and ink-600 no longer clears 3:1 on it. */
  outline:
    "border border-ink-500 text-bone-50 hover:bg-ink-800 hover:border-ink-400",
  /* Neutral action on light surfaces. ink-400 holds the control boundary at
     3:1 or better against the light sections. */
  outlineLight:
    "border border-ink-400 text-ink-900 hover:bg-ink-950/5 hover:border-ink-500",
  /* Subordinate signal action. Currently unused: the hero's Sell CTA was moved
     to `primarySignal` at the client's request, and the /cars closing band uses
     it too. Kept because it is the only red treatment that stays legible on
     charcoal while reading as *quieter* than a filled blue button beside it —
     which is what you want if a sell action ever has to sit next to an accent
     primary. Border is signal-400 rather than signal-500 so the control boundary
     stays clearly visible on the charcoal surface (4.85:1 — it was 5.4:1 before
     the base lightened to #242424). */
  outlineSignal:
    "border border-signal-400 text-signal-300 hover:bg-signal-500/15 hover:border-signal-300",
  ghost: "text-bone-50 hover:bg-white/8",
  ghostLight: "text-ink-900 hover:bg-ink-950/6",
  /* Reserved for genuine WhatsApp actions only */
  whatsapp: "bg-whatsapp text-ink-950 hover:brightness-110 font-semibold",
};

/* min-heights keep every control at or above the 44px touch target */
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-11 px-5 text-[0.9375rem]",
  lg: "min-h-12 px-6 text-base",
  /* Square, icon-only. Carries its own padding *instead of* `md` rather than
     alongside it: `cn()` is a plain join, not tailwind-merge, so a `px-0`
     passed through `className` loses to `md`'s `px-5` (it is emitted later in
     the sheet). The navbar's WhatsApp button did exactly that and rendered a
     44px pill with 40px of padding, squeezing the 24px glyph to 4px wide. */
  icon: "size-11 p-0",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonAsLink = BaseProps & {
  href: string;
  target?: string;
  rel?: string;
  "aria-label"?: string;
};

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

/** Internal links get client-side navigation via next/link. */
function isInternalHref(href: string) {
  return href.startsWith("/") || href.startsWith("#");
}

/**
 * Renders a next/link for internal routes, an <a> for external ones, or a
 * <button> when no href is supplied. One component keeps every CTA on the site
 * visually identical.
 */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  if ("href" in props && props.href !== undefined) {
    const { href, target, rel, variant, size, className, children } = props;
    const ariaLabel = props["aria-label"];
    const classes = buttonClasses({ variant, size, className });

    if (isInternalHref(href)) {
      return (
        <Link
          href={href}
          prefetch={shouldPrefetch(href)}
          aria-label={ariaLabel}
          className={classes}
        >
          {children}
        </Link>
      );
    }

    return (
      <a
        href={href}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
        className={classes}
      >
        {children}
      </a>
    );
  }

  const { variant, size, className, children, ...buttonProps } = props;

  return (
    <button className={buttonClasses({ variant, size, className })} {...buttonProps}>
      {children}
    </button>
  );
}
