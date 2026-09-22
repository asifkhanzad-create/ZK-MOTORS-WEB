import { ArrowLeft, MessageCircle } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageTransition } from "@/components/ui/PageTransition";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/**
 * Shown for any route that does not exist.
 *
 * Vehicle detail pages went live in Phase 3, so the most likely way to land
 * here is now a link to a car that has since been removed from the inventory,
 * or a mistyped URL. The copy therefore offers the inventory and WhatsApp
 * rather than explaining that pages are still being built.
 */
export default function NotFound() {
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <PageTransition>
      <Container>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 py-24 text-center">
          <p className="text-eyebrow text-accent-400">Page not available</p>

          <h1 className="max-w-2xl text-3xl text-bone-50 sm:text-4xl">
            We couldn&rsquo;t find that page
          </h1>

          <p className="max-w-xl text-[0.9375rem] leading-relaxed text-muted-dark">
            The link may be out of date, or the car may have been sold and taken
            off the site. Everything currently in stock is listed in the
            inventory — or message us and we will find what you are after.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              href="/cars"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Browse cars in stock
            </Button>

            {whatsappUrl ? (
              <Button
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="whatsapp"
                size="lg"
                className="w-full sm:w-auto"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                WhatsApp us
              </Button>
            ) : null}
          </div>
        </div>
      </Container>
    </PageTransition>
  );
}
