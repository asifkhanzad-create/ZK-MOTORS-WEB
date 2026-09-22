import type { Metadata } from "next";

import { LegalDocument, type LegalSection } from "@/components/legal/LegalDocument";
import { siteConfig, siteUrl } from "@/config/site";

const title = "Terms of Use";
const description = `The terms that apply to using the ${siteConfig.name} website — how to read the listings, what the prices mean, and what we do and do not warrant.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/terms" },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: `${siteUrl}/terms`,
    siteName: siteConfig.name,
    title: `${title} | ${siteConfig.name}`,
    description,
  },
};

/**
 * Terms of use.
 *
 * The point of these is to stop the website being read as a contract. Every
 * figure on the site is an asking price for a physical object that may already
 * be sold, and no used-car dealer can warrant the condition of a car they have
 * not inspected. The sections below say that plainly.
 *
 * The limitation-of-liability wording is deliberately conservative and narrow
 * rather than the usual all-caps exclusion of everything. It needs a lawyer's
 * eye before it is relied on — the visible note on the page says so.
 */
const sections: LegalSection[] = [
  {
    title: "About these terms",
    body: [
      `These terms apply to your use of the ${siteConfig.name} website. By using the site you accept them. They do not cover anything agreed in person at the showroom, or in a written sale agreement, which will always take precedence over anything on this website.`,
    ],
  },
  {
    title: "Listings are indicative, not offers",
    body: [
      "The inventory on this site describes cars we have for sale, but a listing is not an offer capable of being accepted. A car can be sold, reserved or withdrawn while its listing is still online.",
      "Model year, mileage, transmission, fuel type and other details are recorded as accurately as we can, but they are entered by hand and can be wrong. Confirm anything that matters to you before you travel to see a car.",
    ],
  },
  {
    title: "Prices",
    list: [
      "Prices are asking prices in Pakistani Rupees. They are not fixed prices and are open to discussion.",
      "Prices can change without notice, and a price shown on this site does not bind us.",
      "Prices do not include any transfer, registration or token tax costs unless a listing says otherwise.",
      "The final figure is whatever is agreed between you and the showroom, in person, before the sale is completed.",
    ],
  },
  {
    title: "Condition and history",
    body: [
      "Nothing on this website is a warranty, a guarantee, or a professional assessment of any car's condition. We do not claim that every car has been inspected, and we do not publish accident, ownership or service history.",
      "Used cars are sold as seen. You are welcome — and encouraged — to bring your own mechanic, or to arrange an independent inspection, before you buy. Ask us anything you want to know, and check the documents yourself.",
    ],
  },
  {
    title: "Photographs",
    body: [
      "Photographs are provided to give a general impression of a car. Colours can look different on different screens, and a photograph may predate work done to a car or wear that has happened since.",
      "Some images on this site are free-licence stock photographs standing in for pictures we have not taken yet. Where that is the case, the listing says so.",
    ],
  },
  {
    title: "Links to other services",
    body: [
      "This site links to services we do not control, including WhatsApp and Google Maps. We are not responsible for those services, for their availability, or for anything that happens when you use them. Their own terms apply.",
    ],
  },
  {
    title: "Content on this site",
    body: [
      `The text, layout, photographs and design of this website belong to ${siteConfig.legalName} or are used with permission. Please do not copy them for commercial use without asking first.`,
    ],
  },
  {
    title: "Limit of our responsibility",
    body: [
      "We take care to keep this website accurate, but we cannot promise it will always be complete, current or free of errors, and we do not accept responsibility for losses arising from a decision made solely on the basis of what is published here.",
      "Nothing in these terms limits any right you have under the law that cannot be limited by agreement.",
    ],
  },
  {
    title: "Governing law",
    body: [
      "These terms are governed by the laws of Pakistan, and any dispute arising from your use of this website is subject to the courts of Pakistan.",
    ],
  },
  {
    title: "Changes to these terms",
    body: [
      "We may update these terms from time to time. The version published on this page is the one that applies.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Terms"
      title={title}
      intro="How to read the listings on this site, what the prices mean, and what we are and are not responsible for."
      sections={sections}
      footer={
        <p className="text-[0.9375rem] leading-relaxed text-muted-light">
          Questions about these terms? Email{" "}
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="font-medium text-ink-900 underline decoration-ink-400 underline-offset-2 transition-colors hover:text-accent-600"
          >
            {siteConfig.contact.email}
          </a>{" "}
          or call{" "}
          <a
            href={`tel:${siteConfig.contact.phoneE164}`}
            className="font-medium text-ink-900 underline decoration-ink-400 underline-offset-2 transition-colors hover:text-accent-600"
          >
            {siteConfig.contact.phoneDisplay}
          </a>
          .
        </p>
      }
    />
  );
}
