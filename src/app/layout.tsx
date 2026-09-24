import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HideOnAdmin } from "@/components/layout/HideOnAdmin";
import { MobileWhatsAppButton } from "@/components/layout/MobileWhatsAppButton";
import { siteConfig, siteUrl } from "@/config/site";

import "./globals.css";

/* Self-hosted at build time by next/font — no render-blocking font requests.
   One family drives both the display and body tokens. */
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const description =
  "Browse quality used cars for sale, or sell and exchange your vehicle, with ZK Motors. Visit our showroom in Wah Cantt, Punjab.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ZK Motors | Used Cars in Wah Cantt",
    template: `%s | ${siteConfig.name}`,
  },
  description,
  applicationName: siteConfig.name,
  keywords: [
    "used cars Wah Cantt",
    "used cars Taxila",
    "car dealership Wah Cantt",
    "buy used car Pakistan",
    "sell your car Taxila",
    "car exchange Wah Cantt",
    "ZK Motors",
  ],
  authors: [{ name: siteConfig.legalName }],
  creator: siteConfig.legalName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: siteUrl,
    siteName: siteConfig.name,
    title: "ZK Motors | Used Cars in Wah Cantt",
    description,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ZK Motors — used cars in Wah Cantt",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZK Motors | Used Cars in Wah Cantt",
    description,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  category: "automotive",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* Tints the browser chrome on mobile. This is a literal, not a token read —
     `viewport` is evaluated outside the CSS pipeline, so it cannot see @theme.
     Keep it in step with --color-ink-950 by hand. */
  themeColor: "#242424",
};

/**
 * Local-business structured data.
 * Contact details come from site.ts, so replacing the placeholders there also
 * fixes what search engines read.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: siteConfig.name,
  legalName: siteConfig.legalName,
  description,
  url: siteUrl,
  telephone: siteConfig.contact.phoneE164,
  email: siteConfig.contact.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.address.street,
    addressLocality: siteConfig.address.locality,
    addressRegion: siteConfig.address.region,
    postalCode: siteConfig.address.postalCode,
    addressCountry: siteConfig.address.country,
  },
  areaServed: siteConfig.areasServed.map((area) => ({
    "@type": "City",
    name: area,
  })),
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "09:00",
      closes: "20:00",
    },
  ],
  priceRange: "PKR",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-PK" className={montserrat.variable}>
      <body className="min-h-dvh bg-ink-950 font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent-400 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink-950"
        >
          Skip to content
        </a>

        <HideOnAdmin>
          <Header />
        </HideOnAdmin>

        <main id="main">{children}</main>

        <HideOnAdmin>
          <Footer />
          <MobileWhatsAppButton />

          {/* Marketing structured data. It lives inside the guard so an admin
              page never declares itself an AutoDealer; combined with the
              `noindex` in the admin layout, /admin is invisible to search. */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        </HideOnAdmin>
      </body>
    </html>
  );
}
