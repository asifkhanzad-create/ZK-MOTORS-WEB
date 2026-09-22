"use client";

import { ViewTransition, type ReactNode } from "react";

/**
 * Cross-fades the page content when the route changes.
 *
 * ## Why this exists
 *
 * Clicking a navbar link replaces the document, so there is nothing to
 * *scroll* — the new page simply appears at the top. `scroll-behavior` cannot
 * smooth that over. This gives the swap itself a short cross-fade, which is
 * what makes the navigation read as continuous rather than abrupt.
 *
 * ## Why `update="none"`
 *
 * `enter`/`exit` fire when the boundary mounts/unmounts — that is, on a route
 * change. `update` fires when something *inside* the boundary mutates while it
 * stays mounted — that is, on `/cars`, every filter pill click, because the
 * filter state lives in the URL and the page re-renders in place.
 *
 * `cars/page.tsx` already carries a deliberate decision against exactly that:
 * *"this grid is re-rendered on every filter change, and fading the results in
 * each time reads as flicker rather than polish."* Setting `update="none"`
 * keeps that decision intact while still cross-fading real navigations.
 *
 * `default="none"` means anything not named here (notably `share`, which needs
 * a `name`) stays off, so no animation can appear that was not asked for.
 *
 * ## Degrading
 *
 * Where the browser has no View Transitions support the component is inert and
 * navigation behaves exactly as before. `prefers-reduced-motion` is handled in
 * `globals.css`, which zeroes the `::view-transition-*` durations — the
 * reduced-motion rule for `*` does not reach those pseudo-elements.
 *
 * Children are passed through from a server component, so page content stays
 * server-rendered; only this boundary is client-side.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="auto" exit="auto" update="none" default="none">
      {children}
    </ViewTransition>
  );
}
