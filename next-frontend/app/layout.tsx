import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

/* ════════════════════════════════════════════
   FONTS
   Self-hosted via next/font — zero render blocking.
   CSS variables injected onto <html> for Tailwind v4 @theme.
════════════════════════════════════════════ */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-heading",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-body",
});

/* ════════════════════════════════════════════
   VIEWPORT & THEME
════════════════════════════════════════════ */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F3EE", // Matches your brand background for mobile browser UI
};

/* ════════════════════════════════════════════
   ROOT METADATA
   RULES:
   • No canonical URL here — each page.tsx sets its own
   • No openGraph.url here — each page sets its own for correct share previews
   • metadataBase allows relative URLs in pages to resolve correctly
════════════════════════════════════════════ */
export const metadata: Metadata = {
  metadataBase: new URL("https://qezzy.co.ke"),

  title: {
    default: "Qezzy Surveys | Earn Real Money Sharing Your Opinion in Kenya",
    template: "%s | Qezzy Surveys",
  },

  description:
    "Join 47,000+ Kenyans earning cash for completing surveys. Withdraw instantly to M-Pesa. Free to join, no hidden fees. Start earning today.",

  keywords: [
    "surveys Kenya",
    "earn money online Kenya",
    "M-Pesa surveys",
    "paid surveys East Africa",
    "market research Kenya",
    "Qezzy Surveys",
    "online earnings Kenya",
    "mobile surveys",
    "consumer feedback Kenya",
  ],

  authors: [{ name: "Qezzy Surveys", url: "https://qezzy.co.ke" }],
  creator: "Qezzy Surveys",
  publisher: "Qezzy Surveys",
  category: "Market Research",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "Qezzy Surveys",
    title: "Qezzy Surveys | Earn Real Money Sharing Your Opinion",
    description: "Complete surveys on your phone, earn real shillings, withdraw to M-Pesa in seconds.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Qezzy Surveys – Earn Money Completing Surveys in Kenya",
        type: "image/jpeg",
      },
      {
        url: "/og-image-square.jpg",
        width: 600,
        height: 600,
        alt: "Qezzy Surveys – Earn Money Completing Surveys in Kenya",
        type: "image/jpeg",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@qezzysurveys",
    creator: "@qezzysurveys",
    title: "Qezzy Surveys | Earn Real Money Sharing Your Opinion",
    description: "Join 47,000+ Kenyans earning cash for completing surveys. Withdraw instantly to M-Pesa.",
    images: [
      {
        url: "/og-image.jpg",
        alt: "Qezzy Surveys – Earn Money Completing Surveys in Kenya",
        width: 1200,
        height: 630,
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#C27B3A" }],
  },

  manifest: "/site.webmanifest",

  appleWebApp: {
    capable: true,
    title: "Qezzy Surveys",
    statusBarStyle: "black-translucent",
  },

  other: {
    // Theme color — belt-and-suspenders
    "theme-color": "#F7F3EE",
    "msapplication-TileColor": "#F7F3EE",
    "msapplication-config": "/browserconfig.xml",

    // Geo tags — local SEO signals for Kenya
    "geo.region": "KE",
    "geo.placename": "Nairobi",
    "geo.position": "-1.2921;36.8219",
    "ICBM": "-1.2921, 36.8219",

    // Contact hints for social crawlers
    "og:email": "hello@qezzy.co.ke",
    "og:phone_number": "+254700000000",
    "og:locality": "Nairobi",
    "og:region": "Nairobi County",
    "og:country-name": "Kenya",

    // Dublin Core — academic/aggregator crawlers
    "DC.title": "Qezzy Surveys",
    "DC.subject": "Market Research, Paid Surveys, M-Pesa, Kenya, East Africa",
    "DC.description": "Earn real money sharing your opinion. Withdraw instantly to M-Pesa. Free to join.",
    "DC.type": "Service",
    "DC.language": "en",
  },
};

/* ════════════════════════════════════════════
   SITE-WIDE JSON-LD SCHEMAS

   Rule of thumb:
     layout.tsx → WebSite, Organization, SiteNavigationElement
     page.tsx   → WebPage, FAQPage, BreadcrumbList, LocalBusiness

   Every @id uses fragment URLs so Google can
   cross-reference entities across schemas.
════════════════════════════════════════════ */

/**
 * 1. WebSite Schema
 * — Enables Sitelinks Searchbox in Google results
 * — potentialAction tells Google you have internal search
 */
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://qezzy.co.ke/#website",
  url: "https://qezzy.co.ke",
  name: "Qezzy Surveys",
  alternateName: "Qezzy",
  description: "Earn real money sharing your opinion. Withdraw instantly to M-Pesa.",
  inLanguage: "en-KE",
  copyrightYear: 2024,
  copyrightHolder: { "@id": "https://qezzy.co.ke/#organization" },
  publisher: { "@id": "https://qezzy.co.ke/#organization" },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://qezzy.co.ke/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

/**
 * 2. Organization Schema
 * — Full entity with legalName, contactPoint, areaServed, knowsAbout
 * — Referenced by WebSite.publisher and page-level schemas
 */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://qezzy.co.ke/#organization",
  name: "Qezzy Surveys",
  legalName: "Qezzy Surveys Limited",
  alternateName: "Qezzy",
  url: "https://qezzy.co.ke",
  logo: {
    "@type": "ImageObject",
    "@id": "https://qezzy.co.ke/#logo",
    url: "https://qezzy.co.ke/logo.png",
    width: 512,
    height: 512,
    caption: "Qezzy Surveys",
  },
  image: "https://qezzy.co.ke/og-image.jpg",
  description:
    "Qezzy Surveys connects everyday Kenyans with businesses and researchers who need honest, ground-level feedback. Earn real shillings for completing surveys on your phone, withdraw instantly to M-Pesa.",
  slogan: "Your Opinion Has Always Been Worth Real Money",
  foundingDate: "2024",
  numberOfEmployees: {
    "@type": "QuantitativeValue",
    minValue: 5,
    maxValue: 50,
  },
  telephone: "+254700000000",
  email: "hello@qezzy.co.ke",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Nairobi",
    addressLocality: "Nairobi",
    addressRegion: "Nairobi County",
    postalCode: "00100",
    addressCountry: "KE",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -1.2921,
    longitude: 36.8219,
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+254700000000",
      contactType: "customer service",
      email: "hello@qezzy.co.ke",
      areaServed: ["KE", "UG", "TZ", "RW"],
      availableLanguage: ["English", "Swahili"],
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "00:00",
        closes: "23:59",
      },
    },
  ],
  areaServed: [
    { "@type": "Country", name: "Kenya" },
    { "@type": "Country", name: "Uganda" },
    { "@type": "Country", name: "Tanzania" },
    { "@type": "AdministrativeArea", name: "East Africa" },
  ],
  knowsAbout: [
    "Market Research",
    "Consumer Surveys",
    "M-Pesa Integration",
    "Mobile-First Platforms",
    "User Feedback Collection",
    "Data Privacy",
    "East African Markets",
  ],
  sameAs: [
    "https://www.facebook.com/qezzysurveys",
    "https://twitter.com/qezzysurveys",
    "https://www.instagram.com/qezzysurveys",
    "https://www.linkedin.com/company/qezzy-surveys",
  ],
};

/**
 * 3. SiteNavigationElement Schema
 * — Maps every navbar link with @id, position, name, description
 * — Keep in sync with your Navbar component's navLinks array
 */
const siteNavigationSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": "https://qezzy.co.ke/#site-navigation",
  name: "Main Navigation",
  description: "Primary navigation links for Qezzy Surveys website.",
  numberOfItems: 5,
  itemListElement: [
    {
      "@type": "SiteNavigationElement",
      "@id": "https://qezzy.co.ke/#nav-home",
      position: 1,
      name: "Home",
      description: "Back to the Qezzy Surveys homepage.",
      url: "https://qezzy.co.ke/",
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://qezzy.co.ke/#nav-how-it-works",
      position: 2,
      name: "How It Works",
      description: "Learn how to start earning with Qezzy Surveys in three simple steps.",
      url: "https://qezzy.co.ke/#how-it-works",
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://qezzy.co.ke/#nav-features",
      position: 3,
      name: "Features",
      description: "Discover smart survey matching, instant M-Pesa withdrawals, and more.",
      url: "https://qezzy.co.ke/#features",
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://qezzy.co.ke/#nav-testimonials",
      position: 4,
      name: "Stories",
      description: "Read real experiences from Qezzy members across Kenya.",
      url: "https://qezzy.co.ke/#testimonials",
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://qezzy.co.ke/#nav-faq",
      position: 5,
      name: "FAQ",
      description: "Answers to common questions about Qezzy Surveys.",
      url: "https://qezzy.co.ke/#faq",
    },
  ],
};

/* ════════════════════════════════════════════
   ROOT LAYOUT COMPONENT
════════════════════════════════════════════ */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-KE"
      className={`${playfair.variable} ${dmSans.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Direct meta tags for broader browser support */}
        <meta name="application-name" content="Qezzy Surveys" />
        <meta name="theme-color" content="#F7F3EE" />

        {/* Site-wide JSON-LD — injected on every page */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationSchema) }}
        />
      </head>

      <body className="bg-bg text-text font-body antialiased">
        {/* 
          NOTE: You'll create these components next.
          For now, the page renders correctly without them.
          When ready, I'll help you build:
            • Navbar (with mobile menu, scroll effects)
            • Footer (with links, social icons, contact)
            • Optional: FloatingContactButton for WhatsApp/phone
        */}
        {/* <Navbar /> */}
        
        <main className="min-h-screen">
          {children}
        </main>
        
        {/* <Footer /> */}
        {/* <FloatingContactButton /> */}
      </body>
    </html>
  );
}
