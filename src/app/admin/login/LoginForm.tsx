"use client";

import { AlertCircle } from "lucide-react";
import { useActionState } from "react";

import { signIn, type SignInState } from "@/app/admin/auth-actions";
import { buttonClasses } from "@/components/ui/Button";
import { controlClass, describedBy, fieldBorder, FieldShell } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

const INITIAL: SignInState = { error: null };

/**
 * The sign-in form.
 *
 * A real `<form action={serverAction}>`, so it works before React hydrates and
 * keeps working if the JS chunk fails to load — which matters on the connection
 * a showroom tablet is likely to have. `useActionState` adds the pending state
 * and the error message on top of that; it is not what makes the form submit.
 *
 * The error is rendered once, above the fields, rather than under the email
 * input. A rejected sign-in says nothing about which of the two values was
 * wrong, so attaching it to one field would be a lie about what failed.
 */
export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, INITIAL);
  const error = state.error ?? undefined;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Where to land after signing in. Validated again server-side — this is
          only a convenience, not the control. */}
      <input type="hidden" name="next" value={next} />

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-signal-200 bg-signal-200/25 p-4 text-sm text-ink-900"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal-600" />
          <p>{error}</p>
        </div>
      ) : null}

      <FieldShell id="admin-email" label="Email">
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          /* Not `autoFocus`: it scrolls the page on mobile and opens the
             keyboard over the card before the visitor has read it. */
          className={cn(controlClass, fieldBorder(error))}
          aria-describedby={describedBy("admin-email", error)}
        />
      </FieldShell>

      <FieldShell id="admin-password" label="Password">
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={cn(controlClass, fieldBorder(error))}
          aria-describedby={describedBy("admin-password", error)}
        />
      </FieldShell>

      <button
        type="submit"
        disabled={pending}
        className={buttonClasses({ variant: "primary", size: "lg", className: "mt-1 w-full" })}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
