import type { Metadata } from "next";

import { LegalDocument, type LegalSection } from "@/components/legal/LegalDocument";
import { siteConfig, siteUrl } from "@/config/site";

const title = "Privacy Policy";
const description = `How ${siteConfig.name} handles information on this website — what is collected, what is not, and what happens when you use the enquiry forms.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: `${siteUrl}/privacy`,
    siteName: siteConfig.name,
    title: `${title} | ${siteConfig.name}`,
    description,
  },
};

/**
 * Privacy policy.
 *
 * Written from what this codebase actually does rather than from a template.
 * The public pages were checked for `localStorage`, `sessionStorage`,
 * `document.cookie`, analytics tags and third-party scripts: there are none.
 * That makes this an unusually short and unusually accurate policy, which is
 * worth keeping — if a tracker is ever added, this page becomes wrong the same
 * day.
 *
 * **Two things have changed since it was written, and both are now stated on the
 * page rather than left implied:**
 *
 *   - **The listings come from a database.** Phase 5 moved the inventory to
 *     Supabase, so the old claim that "there is no database behind these pages"
 *     stopped being true. The database holds cars, not visitors, and the page now
 *     says exactly that.
 *   - **The photographs are served by Supabase, not by this site.** Viewing a
 *     listing makes a request to their servers, which is a third party contact
 *     the "Fonts and images" section used to deny.
 *
 * The staff sign-in sets cookies, which is why the page distinguishes the public
 * site from the staff area instead of claiming the site sets none at all. That
 * distinction is only honest because `src/proxy.ts` is scoped to `/admin` — no
 * public page ever touches auth, so no visitor is ever sent a cookie.
 *
 * The one thing it cannot know is which hosting provider serves the site, so
 * that section describes what hosts generally record and says so.
 */
const sections: LegalSection[] = [
  {
    title: "The short version",
    body: [
      `${siteConfig.name} does not set cookies on the public pages of this website, and does not run analytics or advertising trackers. There are no visitor accounts — you can browse every listing without giving us anything. The car listings you see are read from a database we maintain, which holds details of the cars and nothing about you. Nothing you type into a form on this site is transmitted to us by the site itself.`,
    ],
  },
  {
    title: "What this website does not do",
    list: [
      "It does not ask visitors to register, sign in, or create a profile. There is a separate sign-in for our own staff to manage the listings — it lives in its own area of the site, and no visitor is ever asked to use it.",
      "It does not set cookies on any public page. The staff sign-in does set cookies, so that a member of staff stays signed in while they work; that only ever happens inside the staff area.",
      "It does not use Google Analytics, advertising pixels, heatmaps or any other tracking script.",
      "It does not store anything in your browser's local storage or session storage.",
      "It does not sell, rent or share personal information, because it does not collect any.",
    ],
  },
  {
    title: "What happens when you use the enquiry form",
    body: [
      "The form on the sell-your-car page runs entirely in your own browser. When you submit it, the page builds a text message out of what you typed and opens WhatsApp with that message ready to send.",
      "Nothing is sent to this website at that point. There is no server-side form handler and no database record. Your details reach us only if and when you press send inside WhatsApp yourself.",
      "Once the message is in WhatsApp, it is governed by WhatsApp's own privacy policy, not this one. The same applies if you contact us by phone or email instead.",
    ],
  },
  {
    title: "Server logs",
    body: [
      "This website is served by a hosting provider. Like almost every web host, that provider will record standard technical information about requests to the site — typically the IP address, the browser's user-agent string, the page requested and the time. This is used for keeping the site running and for security, not for identifying visitors.",
      "We do not use those logs to build a profile of anyone, and we do not combine them with anything else. If you would like to know which provider hosts the site and how long it retains logs, ask us using the contact details below.",
    ],
  },
  {
    title: "Links that leave this website",
    body: [
      "Some links take you to services we do not control. Once you follow one, that service's own privacy policy applies:",
    ],
    list: [
      "WhatsApp — used for the enquiry links and the chat buttons.",
      "Google Maps — used for the directions link, and only contacted if you click it.",
      "Your phone or email app — used by the call and email links.",
    ],
  },
  {
    title: "Fonts and images",
    body: [
      "The typeface used on this site is downloaded and served from this website itself, so visiting a page does not contact Google or any other font service.",
      "The car photographs are stored with Supabase, the service we use to run the listings database, and are loaded from their servers. Viewing a listing therefore does contact them. Those requests carry only what any web server sees when it serves a file — see “Server logs” above — and nothing you have typed anywhere on this site.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can use this website without giving us any information at all — browsing the inventory requires nothing from you. If you would rather not use the enquiry form, calling the showroom works exactly as well.",
      "If you have already sent us a message and would like us to delete it, contact us and we will do so.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "If this policy changes, the updated version will appear on this page. If we ever add analytics or any other tracking to the site, this page will be updated to say so before it happens.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Privacy"
      title={title}
      intro="This website collects as little as it possibly can, which is why this page is short. It describes exactly what happens to information when you use the site."
      sections={sections}
      footer={
        <p className="text-[0.9375rem] leading-relaxed text-muted-light">
          Questions about any of this? Email{" "}
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
