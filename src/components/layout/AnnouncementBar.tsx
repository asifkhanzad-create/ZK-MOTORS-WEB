import { Clock, MapPin, Phone } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";

/**
 * Compact utility strip above the header.
 * Deliberately quiet: small type, muted colour, no CTA competing with the hero.
 * Height is 44px so the phone link remains a comfortable tap target.
 */
export function AnnouncementBar() {
  return (
    <div className="border-b border-ink-800 bg-ink-950">
      <Container>
        <div className="flex h-11 items-center justify-between gap-4 text-[0.75rem] text-muted-dark sm:text-[0.8125rem]">
          <p className="flex min-w-0 items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-accent-500" />
            <span className="truncate">{siteConfig.basedIn}</span>
          </p>

          <p className="hidden items-center gap-1.5 md:flex">
            <Clock aria-hidden="true" className="size-3.5 shrink-0 text-accent-500" />
            <span>{siteConfig.hours.short}</span>
          </p>

          <a
            href={`tel:${siteConfig.contact.phoneE164}`}
            className="flex shrink-0 items-center gap-1.5 py-3 transition-colors duration-200 hover:text-bone-50"
          >
            <Phone aria-hidden="true" className="size-3.5 shrink-0 text-accent-500" />
            <span className="font-medium">{siteConfig.contact.phoneDisplay}</span>
          </a>
        </div>
      </Container>
    </div>
  );
}
