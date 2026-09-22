import {
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-react";
import Link from "next/link";

import { Wordmark } from "@/components/layout/Wordmark";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SocialIcon, type SocialPlatform } from "@/components/ui/SocialIcon";
import { siteConfig, shouldPrefetch } from "@/config/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * Social entries only render when a real URL is configured in site.ts.
 * No placeholder "#" links — an unconfigured network simply does not appear.
 */
const socialLinks: Array<{
  platform: SocialPlatform;
  label: string;
  href: string | null;
}> = [
  { platform: "facebook", label: "Facebook", href: siteConfig.social.facebook },
  { platform: "instagram", label: "Instagram", href: siteConfig.social.instagram },
  { platform: "youtube", label: "YouTube", href: siteConfig.social.youtube },
];

const activeSocialLinks = socialLinks.filter(
  (item): item is typeof item & { href: string } => Boolean(item.href),
);

export function Footer() {
  const whatsappUrl = buildWhatsAppUrl();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <Container>
        <div className="grid gap-12 py-14 lg:grid-cols-12 lg:gap-8 lg:py-16">
          {/* Brand */}
          <div className="flex flex-col gap-5 lg:col-span-4">
            <Wordmark />
            <p className="max-w-sm text-sm leading-relaxed text-muted-dark">
              ZK Motors buys, sells and exchanges quality used cars for buyers
              and sellers across {siteConfig.serviceArea} and nearby areas.
            </p>

            {activeSocialLinks.length > 0 ? (
              <ul className="flex items-center gap-2">
                {activeSocialLinks.map(({ platform, label, href }) => (
                  <li key={platform}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${siteConfig.name} on ${label}`}
                      className="grid size-11 place-items-center rounded-full border border-ink-800 text-muted-dark transition-colors duration-200 hover:border-ink-600 hover:text-bone-50"
                    >
                      <SocialIcon platform={platform} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Navigation */}
          <nav aria-label="Footer" className="lg:col-span-2">
            <h2 className="text-eyebrow text-bone-50">Explore</h2>
            <ul className="mt-4 flex flex-col gap-0.5">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={shouldPrefetch(item.href)}
                    className="block py-2.5 text-sm text-muted-dark transition-colors duration-200 hover:text-accent-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h2 className="text-eyebrow text-bone-50">Visit or call</h2>
            <ul className="mt-5 flex flex-col gap-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-accent-500"
                />
                <span className="text-muted-dark">{siteConfig.address.full}</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-accent-500"
                />
                <a
                  href={`tel:${siteConfig.contact.phoneE164}`}
                  className="inline-block py-1 text-muted-dark transition-colors duration-200 hover:text-accent-300"
                >
                  {siteConfig.contact.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-accent-500"
                />
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="inline-block break-all py-1 text-muted-dark transition-colors duration-200 hover:text-accent-300"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-accent-500"
                />
                <span className="text-muted-dark">
                  {siteConfig.hours.display}
                  <span className="block text-xs text-ink-400">
                    {siteConfig.hours.note}
                  </span>
                </span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 lg:col-span-3">
            <h2 className="text-eyebrow text-bone-50">Start a conversation</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-dark">
              Send us the car you are looking for, or the one you want to sell.
            </p>
            <div className="mt-2 flex flex-col gap-3">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses({ variant: "whatsapp", size: "md" })}
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  Chat on WhatsApp
                </a>
              ) : null}
              <Button href="/contact" variant="outline" size="md">
                <Navigation aria-hidden="true" className="size-4" />
                Get directions
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 border-t border-ink-800 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-400">
            © {year} {siteConfig.legalName}. All rights reserved.
          </p>
          <ul className="flex items-center gap-6">
            <li>
              <Link
                href="/privacy"
                prefetch={shouldPrefetch("/privacy")}
                className="inline-block py-2 text-xs text-ink-400 transition-colors duration-200 hover:text-bone-50"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                prefetch={shouldPrefetch("/terms")}
                className="inline-block py-2 text-xs text-ink-400 transition-colors duration-200 hover:text-bone-50"
              >
                Terms of Use
              </Link>
            </li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
