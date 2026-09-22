"use client";

import { Menu, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Wordmark } from "@/components/layout/Wordmark";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { siteConfig, shouldPrefetch } from "@/config/site";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * Announcement strip + sticky header.
 * The strip scrolls away; the header stays pinned so the primary actions are
 * always one tap away.
 */
export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const whatsappUrl = buildWhatsAppUrl();

  /** Close and hand focus back to the toggle (used by Escape / scrim). */
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  /* Never leave the panel open if the viewport grows past the mobile breakpoint */
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-50 border-b border-ink-800 bg-ink-950/85 backdrop-blur-md">
        <Container>
          <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
            <Link
              href="/"
              aria-label={`${siteConfig.name} — home`}
              className="rounded-lg"
            >
              <Wordmark />
            </Link>

            {/* Desktop navigation */}
            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {siteConfig.nav.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        prefetch={shouldPrefetch(item.href)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "relative block rounded-full px-3.5 py-2.5 text-sm font-medium",
                          "transition-colors duration-200",
                          isActive
                            ? "text-bone-50"
                            : "text-muted-dark hover:text-bone-50",
                        )}
                      >
                        {item.label}
                        {isActive ? (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-3.5 bottom-0.5 h-0.5 rounded-full bg-accent-400"
                          />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href={`tel:${siteConfig.contact.phoneE164}`}
                className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-dark transition-colors duration-200 hover:text-bone-50 xl:flex"
              >
                <Phone aria-hidden="true" className="size-4 text-accent-500" />
                <span>{siteConfig.contact.phoneDisplay}</span>
              </a>

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with ZK Motors on WhatsApp"
                  className={buttonClasses({
                    variant: "whatsapp",
                    size: "md",
                    className: "px-3.5",
                  })}
                >
                  <MessageCircle aria-hidden="true" className="size-5" />
                </a>
              ) : null}

              <Link
                href="/cars"
                prefetch={shouldPrefetch("/cars")}
                className={buttonClasses({
                  variant: "primary",
                  size: "md",
                  className: "hidden md:inline-flex",
                })}
              >
                Find a Car
              </Link>

              <button
                ref={toggleRef}
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                className="grid size-11 cursor-pointer place-items-center rounded-full border border-ink-700 text-bone-100 transition-colors duration-200 hover:bg-ink-800 lg:hidden"
              >
                <Menu aria-hidden="true" className="size-5" />
              </button>
            </div>
          </div>
        </Container>

      </header>

      {/*
        Rendered as a sibling of <header>, not inside it: the header uses
        backdrop-blur, and any backdrop-filter ancestor becomes the containing
        block for position:fixed descendants. Nested inside, this overlay would
        be clipped to the 64px header bar instead of the viewport.
      */}
      <MobileNav open={menuOpen} onClose={closeMenu} pathname={pathname} />
    </>
  );
}
