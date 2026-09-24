import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared form-field primitives.
 *
 * These lived inside `ValuationForm` until the admin dashboard needed the same
 * controls. Two copies of a control's styling drift — one gets the focus ring
 * fixed and the other does not — so the styling lives here and both forms import
 * it. This module is the only place that defines what a field looks like.
 *
 * No `"use client"`: every export is a plain function or a component without
 * hooks, so it can be used from a Server Component, a Client Component, or a
 * Server Action's form. Adding a hook here would force the whole module client-
 * side and drag `ValuationForm` with it.
 */

/** The small uppercase caption above a control. */
export const labelClass =
  "text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-light";

/** The control surface itself: input, select and textarea all share it. */
export const controlClass =
  "h-12 w-full rounded-xl border bg-white px-3.5 text-[0.9375rem] text-ink-900 " +
  "transition-colors duration-200 placeholder:text-ink-400";

/**
 * Border colour for a control, given its error message.
 *
 * Red is the `signal` ramp, which is the site's "needs attention" colour — the
 * same red the error text below the field uses.
 */
export function fieldBorder(error?: string) {
  return error ? "border-signal-400" : "border-bone-300";
}

/**
 * A label, a control, and one description slot.
 *
 * The error *replaces* the hint rather than sitting beside it, so a screen
 * reader never reads two competing sentences about the same field.
 */
export function FieldShell({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs text-signal-600">
          <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Points `aria-describedby` at whichever description slot `FieldShell` rendered.
 *
 * Returns `undefined` rather than an empty string so React omits the attribute
 * entirely instead of emitting `aria-describedby=""`.
 */
export function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
