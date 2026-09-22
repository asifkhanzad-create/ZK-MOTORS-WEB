"use client";

import { Clock, MapPin, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/Button";
import { siteConfig, shouldPrefetch } from "@/config/site";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * Slide-in mobile navigation panel.
 *
 * Accessibility: Escape closes and restores focus to the trigger, background
 * scroll is locked while open, the panel is a labelled modal dialog, focus moves
 * into the panel on open, and `inert` removes it from the tab order when closed.
 *
 * Layout note: the panel is absolutely positioned inside a fixed, viewport-sized
 * `overflow-hidden` wrapper. A fixed panel translated off-screen would otherwise
 * extend the document's scroll width and cause horizontal scrolling on mobile.
 */
export function MobileNav({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const whatsappUrl = buildWhatsAppUrl();

  /* Escape to close */
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  /* Lock background scroll while the panel is open */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* Move focus into the panel */
  useEffect(() => {
    if (open) firstLinkRef.current?.focus();
  }, [open]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] overflow-hidden lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
      inert={!open}
    >
      {/* Scrim */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink-950/70 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        id="mobile-navigation"
        className={cn(
          "absolute inset-y-0 right-0 z-10 flex w-[min(22rem,88vw)] flex-col",
          "border-l border-ink-800 bg-ink-900 shadow-2xl",
          "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-ink-800 px-5">
          <span className="font-display text-base font-bold text-bone-50">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="grid size-11 cursor-pointer place-items-center rounded-full text-bone-100 transition-colors duration-200 hover:bg-ink-800"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-6">
          <ul className="flex flex-col gap-1">
            {siteConfig.nav.map((item, index) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={item.href}
                    prefetch={shouldPrefetch(item.href)}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center rounded-xl px-4 text-[1.0625rem] font-medium transition-colors duration-200",
                      isActive
                        ? "bg-ink-800 text-accent-300"
                        : "text-bone-100 hover:bg-ink-800",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            {whatsappUrl ? (
              <Button
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="whatsapp"
                size="lg"
              >
                Chat on WhatsApp
              </Button>
            ) : null}
            <Button href="/cars" variant="primary" size="lg">
              Find a Car
            </Button>
          </div>

          <dl className="mt-8 flex flex-col gap-5 border-t border-ink-800 pt-6 text-sm">
            <div className="flex items-start gap-3">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-accent-500"
              />
              <div>
                <dt className="sr-only">Address</dt>
                <dd className="text-bone-200">{siteConfig.address.full}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-accent-500"
              />
              <div>
                <dt className="sr-only">Opening hours</dt>
                <dd className="text-bone-200">
                  {siteConfig.hours.display}
                  <span className="block text-xs text-muted-dark">
                    {siteConfig.hours.note}
                  </span>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-accent-500"
              />
              <div>
                <dt className="sr-only">Phone</dt>
                <dd>
                  <a
                    href={`tel:${siteConfig.contact.phoneE164}`}
                    className="inline-block py-1 font-medium text-bone-200 transition-colors hover:text-accent-300"
                  >
                    {siteConfig.contact.phoneDisplay}
                  </a>
                </dd>
              </div>
            </div>
          </dl>
        </nav>
      </div>
    </div>
  );
}
