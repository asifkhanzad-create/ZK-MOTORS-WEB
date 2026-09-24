"use client";

import { Star, Trash2 } from "lucide-react";
import { useRef } from "react";
import { useFormStatus } from "react-dom";

import { buttonClasses } from "@/components/ui/Button";
import { controlClass } from "@/components/ui/Field";
import { cn } from "@/lib/utils";
import { vehicleStatuses } from "@/lib/vehicle-form";

/**
 * The one-click controls on a stock row.
 *
 * A Client Component for two reasons only:
 *
 *   1. The status `<select>` submits itself on change. Without that, changing a
 *      status costs two interactions (pick, then press a button) for what is the
 *      most frequent action in the whole dashboard.
 *   2. Deleting asks for confirmation. A plain form cannot.
 *
 * Everything else is a real `<form>` posting a Server Action, so each control
 * still works with JavaScript unavailable — the select falls back to needing the
 * button that is rendered for exactly that case, and delete simply proceeds
 * without the prompt.
 *
 * The server actions arrive as props rather than being imported here, so this
 * file stays free of server-only imports and no database module ends up in the
 * browser bundle.
 */

type Actions = {
  setStatus: (formData: FormData) => Promise<void>;
  togglePublished: (formData: FormData) => Promise<void>;
  toggleFeatured: (formData: FormData) => Promise<void>;
  remove: (formData: FormData) => Promise<void>;
};

/** Disables itself while its own form is in flight, so a double-click cannot
 *  fire the action twice. */
function SubmitButton({
  children,
  variant,
  size = "sm",
  className,
  title,
}: {
  children: React.ReactNode;
  variant: "outlineLight" | "ghostLight" | "primarySignal";
  size?: "sm" | "icon";
  className?: string;
  title?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      className={buttonClasses({ variant, size, className })}
    >
      {children}
    </button>
  );
}

export function VehicleRowActions({
  id,
  status,
  published,
  featured,
  actions,
}: {
  id: string;
  status: string;
  published: boolean;
  featured: boolean;
  actions: Actions;
}) {
  const statusForm = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status. Auto-submits on change; the button is the no-JS path and stays
          in the tab order so the control is reachable by keyboard either way. */}
      <form ref={statusForm} action={actions.setStatus} className="flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <label className="sr-only" htmlFor={`status-${id}`}>
          Status for {id}
        </label>
        <select
          id={`status-${id}`}
          name="status"
          defaultValue={status}
          onChange={() => statusForm.current?.requestSubmit()}
          className={cn(controlClass, "h-10 w-[8.5rem] cursor-pointer py-0 text-sm")}
        >
          {vehicleStatuses.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {/* Visible only when scripting is off, where the select cannot submit
            itself. `hidden` would remove it from the accessibility tree, so it
            is hidden by CSS instead — and it must remain a real button. */}
        <noscript>
          <button type="submit" className={buttonClasses({ variant: "outlineLight", size: "sm" })}>
            Set
          </button>
        </noscript>
      </form>

      <form action={actions.togglePublished}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="published" value={published ? "false" : "true"} />
        <SubmitButton
          variant="outlineLight"
          title={published ? "Hide from the website" : "Show on the website"}
        >
          {published ? "Unpublish" : "Publish"}
        </SubmitButton>
      </form>

      <form action={actions.toggleFeatured}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="featured" value={featured ? "false" : "true"} />
        <SubmitButton
          variant="ghostLight"
          size="icon"
          title={featured ? "Remove from the homepage" : "Feature on the homepage"}
        >
          <Star
            aria-hidden="true"
            className={cn("size-4", featured ? "fill-accent-500 text-accent-600" : "text-ink-500")}
          />
          <span className="sr-only">
            {featured ? "Remove from the homepage" : "Feature on the homepage"}
          </span>
        </SubmitButton>
      </form>

      <form
        action={actions.remove}
        onSubmit={(event) => {
          /* Names the car and the alternative, because "Delete" alone does not
             convey that this is the irreversible one — unpublishing is the
             reversible option and sits right beside it. */
          const ok = window.confirm(
            `Delete "${id}" permanently?\n\n` +
              "This cannot be undone. To take it off the site but keep the record, " +
              "use Unpublish instead.",
          );
          if (!ok) event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <SubmitButton variant="ghostLight" size="icon" title={`Delete ${id}`}>
          <Trash2 aria-hidden="true" className="size-4 text-signal-600" />
          <span className="sr-only">Delete {id}</span>
        </SubmitButton>
      </form>
    </div>
  );
}
