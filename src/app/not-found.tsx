import { ArrowLeft, MessageCircle } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/**
 * Shown for any route that does not exist yet.
 *
 * `/cars` is live as of Phase 2, but the vehicle detail pages under it
 * (`/cars/{id}`) are Phase 3 — so the most likely way to land here is clicking
 * "View Details" on a car. The copy therefore leads with the inventory rather
 * than the homepage, and offers WhatsApp as the fallback that always works.
 */
export default function NotFound() {
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <Container>
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 py-24 text-center">
        <p className="text-eyebrow text-accent-400">Page not available</p>

        <h1 className="max-w-2xl text-3xl text-bone-50 sm:text-4xl">
          We couldn&rsquo;t find that page
        </h1>

        <p className="max-w-xl text-[0.9375rem] leading-relaxed text-muted-dark">
          Full vehicle detail pages are still being built. The inventory itself
          is live — browse the cars in stock, or message us about any listing and
          we will send you the photos and details directly.
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
  );
}
