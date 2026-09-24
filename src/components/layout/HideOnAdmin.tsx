"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders its children everywhere except under `/admin`.
 *
 * The admin dashboard is internal tooling. The marketing navbar, the footer and
 * the floating WhatsApp button are all wrong on it: the navbar's links lead back
 * into the shop, and a WhatsApp button hovering over a stock-management table is
 * noise. The admin gets its own chrome instead.
 *
 * **Why a client wrapper rather than a route group.** The tidy answer is to move
 * every public page into a `(site)` route group and give `(admin)` a second root
 * layout. That relocates eight verified page directories and puts the styled 404
 * — which two QA harnesses assert on — at the mercy of a layout change, to solve
 * a problem that is one conditional. `Header` already calls `usePathname()`, so
 * the path is available for free. This is the smaller, reversible change.
 *
 * The children are passed through from the server, so `Footer` stays a Server
 * Component — it is rendered on the server and handed over as a payload; this
 * component only decides whether to place it in the tree.
 *
 * If the admin ever needs a genuinely separate document (its own `<html>`,
 * different fonts, no marketing CSS at all), that is the point to revisit this
 * and adopt the route group.
 */
export function HideOnAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  /* `usePathname()` is typed as `string | null`. Null means "not mounted yet",
     which is not the admin, so the chrome renders — the safe direction, since a
     missing header on a public page is a visible bug and a stray header on an
     admin page is not. */
  if (pathname?.startsWith("/admin")) return null;

  return <>{children}</>;
}
