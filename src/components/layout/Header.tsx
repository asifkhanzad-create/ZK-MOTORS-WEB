"use client";

import { MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Wordmark } from "@/components/layout/Wordmark";
import { buttonClasses } from "@/components/ui/Button";
import { siteConfig, shouldPrefetch } from "@/config/site";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/*
 * ============================================================================
 * Floating pill navigation
 * ============================================================================
 * Adapted from the "Pill Highlight Navigation Bar" demo by CodeFronts
 * (codefronts.com/navigation/tailwind-css-responsive-navbars/
 *  tailwind-pill-highlight-navigation-bar/), MIT licensed.
 *
 * Kept from the original: one capsule at every width, the solid active pill,
 * the translucent hover tease, and the doubled shadow (a tight dark contact
 * shadow plus a wide soft float shadow — one alone reads either stuck to the
 * page or weightless).
 *
 * Five deliberate departures, each for a reason this site has and the demo did
 * not:
 *
 * 1. `bg-white/6` -> `bg-ink-950/85`. The demo sits on a permanently dark page.
 *    This site alternates dark and light bands, so a 6%-white capsule drifts
 *    over bone-50 sections, where the capsule and its near-white text measure
 *    1.00:1 — invisible. An 85% charcoal scrim gives the capsule its own
 *    controlled backdrop: 10.6:1 for the wordmark and 5.05:1 for the links over
 *    the lightest band, and 8.1:1 measured over a real bone-50 section.
 * 2. `z-100` -> `z-50`. z-100 is fine on a standalone demo page. Here the
 *    mobile filter sheet is z-70 and has to cover the header when it opens, so
 *    the header must stay below it.
 * 3. The checkbox + `group-has-checked:` toggle is a real <button> carrying
 *    `aria-expanded` / `aria-controls`. The original marks its control
 *    `aria-hidden`, which hides the only way to open the menu from assistive
 *    tech, and it has no Escape handler and no focus return. A disclosure needs
 *    all three.
 * 4. The dropped panel is a sibling of the capsule, not a child of it, so it
 *    can span the header's width. As a child it would be squeezed to the
 *    capsule's width — about 260px on a 360px screen, with five links inside.
 * 5. The active pill is `bone-50` on `ink-950` — near-white, as designed —
 *    rather than the cobalt the old underline used. See the note on the desktop
 *    links below.
 *
 * ---------------------------------------------------------------------------
 * Height, and why it is 86px
 * ---------------------------------------------------------------------------
 *   44px controls (every interactive element, so no target drops below 44)
 * + 12px capsule padding (p-1.5, both sides)
 * +  2px capsule border (border, both sides)
 * + 28px float padding (py-3.5 on the header)
 * = 86px
 *
 * That number is published as `--spacing-nav` in globals.css, and everything
 * that sticks below the header offsets by that token rather than by a literal.
 * qa/qa-nav.mjs asserts the rendered header is this tall at six viewports, so
 * the token and the markup cannot drift apart silently.
 */

export function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const whatsappUrl = buildWhatsAppUrl();

  /*
   * The menu remembers *which pathname it was opened at*, not simply whether it
   * is open. `menuOpen` is then derived, so navigating closes the panel for free
   * — the stored pathname stops matching. The obvious alternative, a
   * `useEffect` that calls setState on every pathname change, is exactly what
   * the react-hooks/set-state-in-effect rule exists to prevent, and it renders
   * one frame with the panel still open over the new page.
   *
   * The panel's own links still call closeMenu(): a link pointing at the page
   * you are already on never changes the pathname, so nothing else would close
   * it. `openedAt !== null` guards the case where usePathname() is briefly null.
   */
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const menuOpen = openedAt !== null && openedAt === pathname;

  /** Close without touching focus — for link clicks and outside clicks. */
  const closeMenu = useCallback(() => setOpenedAt(null), []);

  /** Close and hand focus back to the toggle — for Escape. */
  const dismissMenu = useCallback(() => {
    setOpenedAt(null);
    toggleRef.current?.focus();
  }, []);

  /**
   * Every navbar link goes through here.
   *
   * Two cases, and they behave differently on purpose:
   *
   * **Same route.** Next.js skips its scroll reset when the destination is the
   * route you are already on, so clicking "Cars" while on /cars did nothing at
   * all — measured, the viewport stayed at scrollY 1800. So we do it ourselves,
   * smoothly, which is the only place a smooth scroll is meaningful here.
   *
   * **Different route.** Left alone. The browser loads a new document, so there
   * is no scroll to animate; Next's reset puts you at the top. That reset only
   * lands correctly because globals.css no longer sets `scroll-behavior: smooth`
   * on <html> — with it, the reset animated from the old position and settled
   * short at 131px.
   */
  const handleNavClick = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
      /* Let modified clicks through so open-in-new-tab and friends still work. */
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      closeMenu();

      if (href !== pathname) return;

      event.preventDefault();

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    },
    [pathname, closeMenu],
  );

  /* Escape closes. Focus normally stays on the toggle, so this only has to act
     once focus has moved down into the panel. */
  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismissMenu();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, dismissMenu]);

  /* A press anywhere outside the header closes the panel. `pointerdown` rather
     than `click` so the panel is already gone when the pressed element's own
     click handler runs. */
  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (target && !headerRef.current?.contains(target)) closeMenu();
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen, closeMenu]);

  /* Never leave the panel open if the viewport grows past the breakpoint */
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) setOpenedAt(null);
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <AnnouncementBar />

      <header ref={headerRef} className="sticky top-0 z-50 px-3 py-3.5 sm:px-4">
        {/* The positioning context for the dropped panel, so the panel can span
            the header's width rather than the capsule's. */}
        <div className="relative mx-auto w-full max-w-7xl">
          <nav
            aria-label="Main"
            className={cn(
              "mx-auto flex w-fit items-center gap-1 rounded-full",
              "border border-white/10 bg-ink-950/85 p-1.5 backdrop-blur-md",
              "shadow-[0_8px_32px_oklch(0_0_0/0.4),inset_0_1px_0_oklch(1_0_0/0.08)]",
            )}
          >
            <Link
              href="/"
              aria-label={`${siteConfig.name} — home`}
              onClick={(event) => handleNavClick(event, "/")}
              className="shrink-0 rounded-full px-3 py-1"
            >
              <Wordmark />
            </Link>

            <span
              aria-hidden="true"
              className="hidden h-5 w-px shrink-0 bg-white/15 lg:block"
            />

            {/* Desktop navigation */}
            <ul className="hidden items-center gap-1 lg:flex">
              {siteConfig.nav.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    {/*
                      The active fill is applied from the same `isActive` that
                      sets aria-current, rather than from an
                      `aria-[current=page]:` variant as the demo does. With both
                      `hover:` and `aria-[current=page]:` on one element the
                      winner depends on Tailwind's internal variant order, so
                      hovering the current pill could strip its fill. One
                      conditional removes the question.

                      The fill is bone-50 with ink-950 text — near-white, as the
                      design specifies — and not the accent cobalt the old
                      underline used. On /cars the current pill sits a few
                      hundred pixels from the cobalt "Find a Car" button, and
                      both point at the same page; two cobalt pills in one
                      capsule read as a mistake. Near-white says "you are here",
                      cobalt says "click me", and they no longer compete.
                    */}
                    <Link
                      href={item.href}
                      prefetch={shouldPrefetch(item.href)}
                      onClick={(event) => handleNavClick(event, item.href)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "block rounded-full px-3.5 py-3 text-sm font-medium whitespace-nowrap",
                        "transition-colors duration-200",
                        isActive
                          ? "bg-bone-50 text-ink-950 shadow-[0_1px_4px_oklch(0_0_0/0.25)]"
                          : "text-muted-dark hover:bg-white/10 hover:text-bone-50",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <span
              aria-hidden="true"
              className="hidden h-5 w-px shrink-0 bg-white/15 lg:block"
            />

            {/* The announcement strip scrolls away, so the number stays in the
                sticky capsule — calls are the first priority on this site. */}
            <a
              href={`tel:${siteConfig.contact.phoneE164}`}
              className="hidden shrink-0 items-center gap-2 rounded-full px-3 py-3 text-sm font-medium text-muted-dark transition-colors duration-200 hover:text-bone-50 xl:flex"
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
                  size: "icon",
                  className: "shrink-0",
                })}
              >
                {/* `size: "icon"` rather than `md` + a `px-0` override: the
                    override silently lost to the size's own `px-5`, which left
                    the glyph squeezed into 4px of a 44px button. */}
                <MessageCircle aria-hidden="true" className="size-6" />
              </a>
            ) : null}

            {/*
              Wrapped rather than given `hidden md:inline-flex` directly.

              `cn()` in src/lib/utils.ts is a plain join, not tailwind-merge, so
              a `hidden` passed into buttonClasses sits in the same class list as
              the variant's own `inline-flex` — and in the compiled sheet
              `.inline-flex` is emitted after `.hidden`, so `inline-flex` wins and
              the button never hides. Giving the wrapper the responsive display
              leaves `hidden` with no competitor.
            */}
            <span className="hidden shrink-0 md:inline-flex">
              <Link
                href="/cars"
                prefetch={shouldPrefetch("/cars")}
                onClick={(event) => handleNavClick(event, "/cars")}
                className={buttonClasses({ variant: "primary", size: "md" })}
              >
                Find a Car
              </Link>
            </span>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpenedAt(menuOpen ? null : pathname)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls={panelId}
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-bone-100 transition-colors duration-200 hover:bg-white/10 lg:hidden"
            >
              {/*
                2px bars on a 4px gap put the bar centres 6px apart, so the
                outer two move 6px (translate-y-1.5) to meet in the middle and
                cross into an X.
              */}
              <span aria-hidden="true" className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "block h-0.5 w-5 rounded-sm bg-bone-100 transition-transform duration-300",
                    menuOpen && "translate-y-1.5 rotate-45",
                  )}
                />
                <span
                  className={cn(
                    "block h-0.5 w-5 rounded-sm bg-bone-100 transition-opacity duration-300",
                    menuOpen && "opacity-0",
                  )}
                />
                <span
                  className={cn(
                    "block h-0.5 w-5 rounded-sm bg-bone-100 transition-transform duration-300",
                    menuOpen && "-translate-y-1.5 -rotate-45",
                  )}
                />
              </span>
            </button>
          </nav>

          {/*
            The mobile menu: a card that drops out of the capsule.

            `absolute` rather than in flow, so opening it does not push the page
            down. `invisible` rather than only `opacity-0` when closed, because
            visibility:hidden is what takes the links out of the tab order and
            the accessibility tree — and because it is in the transition list,
            the fade-out still runs to completion before they go.

            This sits outside the <nav>, which carries backdrop-blur. A
            backdrop-filter ancestor becomes the containing block for fixed
            descendants, and this panel is absolutely positioned against the
            wrapper instead so it can be as wide as the header.
          */}
          <div
            id={panelId}
            className={cn(
              "absolute inset-x-0 top-[calc(100%+0.5rem)] z-10 origin-top rounded-3xl",
              "border border-white/10 bg-ink-950/95 p-2 backdrop-blur-md",
              "shadow-[0_16px_40px_oklch(0_0_0/0.5)]",
              "transition-[opacity,transform,visibility] duration-200 ease-out",
              "lg:hidden",
              menuOpen
                ? "visible translate-y-0 opacity-100"
                : "invisible pointer-events-none -translate-y-1 opacity-0",
            )}
          >
            <nav aria-label="Mobile" className="flex flex-col">
              {siteConfig.nav.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={shouldPrefetch(item.href)}
                    onClick={(event) => handleNavClick(event, item.href)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center rounded-full px-4 text-[0.9375rem] font-medium",
                      "transition-colors duration-200",
                      isActive
                        ? "bg-bone-50 text-ink-950"
                        : "text-muted-dark hover:bg-white/8 hover:text-bone-50",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/*
              The two things a buyer actually needs on a phone. "Find a Car" is
              not repeated here — it is already the "Cars" link two rows up.
            */}
            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className={buttonClasses({
                    variant: "whatsapp",
                    size: "lg",
                    className: "w-full",
                  })}
                >
                  <MessageCircle aria-hidden="true" className="size-5" />
                  Chat on WhatsApp
                </a>
              ) : null}

              <a
                href={`tel:${siteConfig.contact.phoneE164}`}
                onClick={closeMenu}
                className={buttonClasses({
                  variant: "outline",
                  size: "lg",
                  className: "w-full",
                })}
              >
                <Phone aria-hidden="true" className="size-4" />
                {siteConfig.contact.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
