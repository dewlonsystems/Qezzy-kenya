import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

/* ════════════════════════════════════════════
   FONTS
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
   VIEWPORT
════════════════════════════════════════════ */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F3EE",
};

/* ════════════════════════════════════════════
   ROOT METADATA
════════════════════════════════════════════ */
export const metadata: Metadata = {
  metadataBase: new URL("https://qezzykenya.company"),

  title: {
    default:
      "Qezzy Surveys Kenya – Earn Real Money Online | Paid Surveys via M-Pesa",
    template: "%s | Qezzy Surveys Kenya",
  },

  description:
    "Join 47,000+ Kenyans earning real money online from home. Complete paid surveys, get paid instantly to M-Pesa. No experience needed, 100% free to join. Kenya's #1 legit online earning platform — start your side hustle today.",

  keywords: [
    // ── Brand
    "Qezzy",
    "Qezzy Surveys",
    "Qezzy Kenya",
    "Qezzy Surveys Kenya",
    "Qezzy reviews",
    "is Qezzy legit",
    "does Qezzy pay",

    // ── Core: Paid Surveys
    "paid surveys Kenya",
    "online surveys Kenya",
    "earn money surveys Kenya",
    "get paid for surveys Kenya",
    "survey sites that pay in Kenya",
    "best survey sites Kenya 2025",
    "best survey sites Kenya 2026",
    "legitimate paid surveys Kenya",
    "real paid surveys Kenya",
    "trusted survey sites Kenya",
    "surveys that pay real money Kenya",
    "survey apps Kenya",
    "survey websites Kenya",
    "how to earn money from surveys in Kenya",
    "which survey sites pay in Kenya",
    "top paid survey sites Kenya",
    "free paid surveys Kenya",
    "consumer surveys Kenya",
    "opinion surveys Kenya",
    "online market research Kenya",
    "paid market research Kenya",
    "survey panel Kenya",
    "survey rewards Kenya",
    "survey cash Kenya",
    "survey points Kenya",

    // ── M-Pesa Payments
    "M-Pesa surveys",
    "surveys that pay via M-Pesa",
    "earn M-Pesa online",
    "make money M-Pesa Kenya",
    "withdraw to M-Pesa",
    "instant M-Pesa payment surveys",
    "M-Pesa cash out surveys",
    "how to earn M-Pesa online",
    "earn money M-Pesa Kenya",
    "sites that pay M-Pesa Kenya",

    // ── Online Jobs Kenya
    "online jobs Kenya",
    "online jobs in Kenya",
    "online jobs Kenya 2025",
    "online jobs Kenya 2026",
    "legit online jobs Kenya",
    "genuine online jobs Kenya",
    "real online jobs Kenya",
    "legitimate online jobs Kenya",
    "paying online jobs Kenya",
    "trusted online jobs Kenya",
    "online jobs that pay real money Kenya",
    "best online jobs Kenya",
    "top online jobs Kenya",
    "verified online jobs Kenya",
    "new online jobs Kenya",
    "online jobs for beginners Kenya",
    "easy online jobs Kenya",

    // ── Work From Home
    "work from home Kenya",
    "work from home jobs Kenya",
    "jobs from home Kenya",
    "work at home Kenya",
    "remote jobs Kenya",
    "remote work Kenya",
    "remote jobs Kenya no experience",
    "work from home opportunities Kenya",
    "flexible work from home Kenya",
    "online work Kenya",
    "work online Kenya",
    "work online from home Kenya",
    "work from phone Kenya",
    "earn money on phone Kenya",

    // ── Side Hustle / Extra Income
    "side hustle Kenya",
    "side hustle ideas Kenya",
    "side income Kenya",
    "extra income Kenya",
    "passive income Kenya",
    "how to make extra money in Kenya",
    "how to earn extra income Kenya",
    "second income Kenya",
    "earn money from home Kenya",
    "earn money online at home Kenya",
    "earn money online free Kenya",
    "earn money without investment Kenya",
    "earn online Kenya",
    "earn cash Kenya",

    // ── Make Money Online
    "make money online Kenya",
    "how to make money online in Kenya",
    "ways to make money online Kenya",
    "how to earn money online in Kenya",
    "earn real money online Kenya",
    "earn cash online Kenya",
    "best ways to make money online Kenya",
    "make money online Kenya free",
    "make money online Kenya no investment",
    "make money online Kenya M-Pesa",
    "how to make money online Kenya for free",
    "online earning Kenya",
    "online earning sites Kenya",
    "trusted earning sites Kenya",
    "free online earning sites Kenya",
    "online earning apps Kenya",
    "online money making apps Kenya",

    // ── Students & Unemployed
    "online jobs for students Kenya",
    "online jobs for university students Kenya",
    "earn money as a student Kenya",
    "online jobs for graduates Kenya",
    "online jobs for unemployed Kenya",
    "part time online jobs Kenya",
    "part time work from home Kenya",
    "online jobs no experience Kenya",
    "online jobs for teenagers Kenya",
    "online jobs for youth Kenya",
    "earn money for free Kenya",
    "earn while studying Kenya",

    // ── Gig Economy / Micro Tasks
    "gig economy Kenya",
    "micro tasks Kenya",
    "task based online jobs Kenya",
    "online gigs Kenya",
    "freelance jobs Kenya",
    "data entry jobs Kenya",
    "mobile jobs Kenya",
    "internet jobs Kenya",
    "digital jobs Kenya",
    "phone jobs Kenya",

    // ── Geo: City Targeting
    "online jobs Nairobi",
    "earn money online Nairobi",
    "work from home Nairobi",
    "online jobs Mombasa",
    "earn money online Mombasa",
    "online jobs Kisumu",
    "online jobs Nakuru",
    "online jobs Eldoret",
    "online jobs Thika",
    "online jobs Kikuyu",
    "online jobs Machakos",
    "online jobs Nyeri",
    "online jobs Meru",
    "online jobs Kilifi",
    "online jobs Malindi",
    "online jobs Kitale",
    "earn money online East Africa",
    "online jobs East Africa",

    // ── East Africa Regional
    "paid surveys East Africa",
    "online jobs Tanzania",
    "online jobs Uganda",
    "online surveys East Africa",
    "M-Pesa earnings",
    "mobile money surveys Africa",

    // ── General Reach
    "market research Kenya",
    "consumer feedback Kenya",
    "share your opinion get paid",
    "get paid for your opinion Kenya",
    "opinion rewards Kenya",
  ],

  authors: [{ name: "Qezzy Surveys", url: "https://qezzykenya.company" }],
  creator: "Qezzy Surveys",
  publisher: "Qezzy Surveys",

  category:
    "Market Research, Online Jobs, Work From Home, Make Money Online, Side Hustle",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "Qezzy Surveys",
    title:
      "Qezzy Surveys Kenya – Earn Real Money Online | Paid Surveys via M-Pesa",
    description:
      "Complete surveys on your phone, earn real Kenyan shillings, withdraw to M-Pesa instantly. Join 47,000+ Kenyans. Free to join — no hidden fees. Kenya's most trusted online earning platform.",
    url: "https://qezzykenya.company",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Qezzy Surveys – Earn Real Money Online in Kenya via M-Pesa",
        type: "image/jpeg",
      },
      {
        url: "/og-image-square.jpg",
        width: 600,
        height: 600,
        alt: "Qezzy Surveys – Kenya's #1 Paid Survey Platform",
        type: "image/jpeg",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@qezzysurveys",
    creator: "@qezzysurveys",
    title: "Qezzy Surveys Kenya – Earn Real Money | M-Pesa Payouts",
    description:
      "Join 47,000+ Kenyans earning from home. Complete surveys, earn cash, withdraw to M-Pesa instantly. Free to join. Legit online jobs Kenya.",
    images: [
      {
        url: "/og-image.jpg",
        alt: "Qezzy Surveys – Earn Real Money Online in Kenya via M-Pesa",
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
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#C27B3A" },
    ],
  },

  manifest: "/site.webmanifest",

  appleWebApp: {
    capable: true,
    title: "Qezzy Surveys",
    statusBarStyle: "black-translucent",
  },

  other: {
    // ── Theme / Browser UI
    "theme-color": "#F7F3EE",
    "msapplication-TileColor": "#F7F3EE",
    "msapplication-config": "/browserconfig.xml",

    // ── Local SEO: Kenya
    "geo.region": "KE",
    "geo.placename": "Nairobi, Kenya",
    "geo.position": "-1.2921;36.8219",
    ICBM: "-1.2921, 36.8219",

    // ── Open Graph Contact (social crawlers)
    "og:email": "hello@qezzykenya.company",
    "og:phone_number": "+254728722746",
    "og:locality": "Nairobi",
    "og:region": "Nairobi County",
    "og:country-name": "Kenya",
    "og:postal-code": "00100",

    // ── Dublin Core (academic & aggregator crawlers)
    "DC.title": "Qezzy Surveys Kenya",
    "DC.subject":
      "Paid Surveys, Earn Money Online, M-Pesa, Online Jobs Kenya, Work From Home Kenya, Side Hustle Kenya, Market Research, East Africa",
    "DC.description":
      "Earn real money sharing your opinion via paid surveys. Withdraw instantly to M-Pesa. Free to join. Kenya's most trusted online earning platform.",
    "DC.type": "Service",
    "DC.language": "en",
    "DC.coverage": "Kenya, East Africa",
    "DC.rights": "Copyright 2024 Qezzy Surveys",

    // ── Classification
    "classification":
      "Online Jobs, Work From Home, Paid Surveys, Market Research, Side Hustle",
    "rating": "General",
    "revisit-after": "3 days",
    "language": "English",
    "target": "all",
    "HandheldFriendly": "True",
    "MobileOptimized": "320",

    // ── Referrer & Privacy
    "referrer": "origin-when-cross-origin",
  },
};

/* ════════════════════════════════════════════
   JSON-LD SCHEMAS
   layout.tsx owns: WebSite, Organization, SiteNavigationElement
   page.tsx owns:   WebPage, FAQPage, BreadcrumbList, Product
════════════════════════════════════════════ */

/** 1. WebSite — enables Sitelinks Searchbox */
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://qezzykenya.company/#website",
  url: "https://qezzykenya.company",
  name: "Qezzy Surveys",
  alternateName: ["Qezzy", "Qezzy Kenya", "Qezzy Surveys Kenya"],
  description:
    "Kenya's #1 paid survey platform. Earn real money online, withdraw instantly to M-Pesa. Free to join.",
  inLanguage: "en-KE",
  copyrightYear: 2024,
  copyrightHolder: { "@id": "https://qezzykenya.company/#organization" },
  publisher: { "@id": "https://qezzykenya.company/#organization" },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate:
        "https://qezzykenya.company/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

/** 2. Organization — full entity with all trust signals */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://qezzykenya.company/#organization",
  name: "Qezzy Surveys",
  legalName: "Qezzy Surveys Limited",
  alternateName: ["Qezzy", "Qezzy Kenya"],
  url: "https://qezzykenya.company",
  logo: {
    "@type": "ImageObject",
    "@id": "https://qezzykenya.company/#logo",
    url: "https://qezzykenya.company/logo.png",
    width: 512,
    height: 512,
    caption: "Qezzy Surveys – Earn Real Money Online in Kenya",
  },
  image: "https://qezzykenya.company/og-image.jpg",
  description:
    "Qezzy Surveys connects everyday Kenyans with businesses and researchers who need honest, ground-level feedback. Earn real shillings for completing surveys on your phone and withdraw instantly to M-Pesa. Join 47,000+ Kenyans already earning from home.",
  slogan: "Your Opinion Has Always Been Worth Real Money",
  foundingDate: "2024",
  numberOfEmployees: {
    "@type": "QuantitativeValue",
    minValue: 5,
    maxValue: 50,
  },
  telephone: "+254728722746",
  email: "info@qezzykenya.company",
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
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Qezzy Surveys Earning Opportunities",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Paid Online Surveys",
          description:
            "Complete surveys on your phone and earn real Kenyan shillings, paid out instantly to M-Pesa.",
          provider: { "@id": "https://qezzykenya.company/#organization" },
          areaServed: { "@type": "Country", name: "Kenya" },
          availableLanguage: ["English", "Swahili"],
        },
        price: "0",
        priceCurrency: "KES",
        availability: "https://schema.org/InStock",
        description: "Free to join. No hidden fees.",
      },
    ],
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+254728722746",
      contactType: "customer service",
      email: "info@qezzykenya.company",
      areaServed: ["KE", "UG", "TZ", "RW"],
      availableLanguage: ["English", "Swahili"],
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
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
    "Paid Online Surveys",
    "Market Research",
    "Consumer Surveys",
    "M-Pesa Integration",
    "Mobile Money Payments",
    "Work From Home Jobs Kenya",
    "Online Jobs Kenya",
    "Side Hustle Kenya",
    "Mobile-First Earning Platforms",
    "User Feedback Collection",
    "Data Privacy",
    "East African Markets",
    "Micro Task Platforms",
    "Gig Economy Kenya",
  ],
  sameAs: [
    "https://www.facebook.com/qezzysurveys",
    "https://twitter.com/qezzysurveys",
    "https://www.instagram.com/qezzysurveys",
    "https://www.linkedin.com/company/qezzy-surveys",
    "https://www.tiktok.com/@qezzysurveys",
  ],
};

/** 3. SiteNavigationElement — maps navbar for Google */
const siteNavigationSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": "https://qezzykenya.company/#site-navigation",
  name: "Main Navigation",
  description: "Primary navigation links for Qezzy Surveys Kenya.",
  numberOfItems: 5,
  itemListElement: [
    {
      "@type": "SiteNavigationElement",
      "@id": "https://qezzykenya.company/#nav-home",
      position: 1,
      name: "Home",
      description:
        "Qezzy Surveys homepage — Kenya's #1 paid survey platform.",
      url: "https://qezzykenya.company/",
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://qezzykenya.company/#nav-how-it-works",
      position: 2,
      name: "How It Works",
      description:
        "Learn how to start earning money online in Kenya with Qezzy in three simple steps.",
      url: "https://qezzykenya.company/#how-it-works",
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://qezzykenya.company/#nav-features",
      position: 3,
      name: "Features",
      description:
        "Smart survey matching, instant M-Pesa withdrawals, and more.",
      url: "https://qezzykenya.company/#features",
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://qezzykenya.company/#nav-testimonials",
      position: 4,
      name: "Success Stories",
      description:
        "Real experiences from Qezzy members earning money online across Kenya.",
      url: "https://qezzykenya.company/#testimonials",
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://qezzykenya.company/#nav-faq",
      position: 5,
      name: "FAQ",
      description:
        "Common questions about earning money online and completing surveys with Qezzy Kenya.",
      url: "https://qezzykenya.company/#faq",
    },
  ],
};

/** 4. BreadcrumbList — site-level breadcrumb for rich results */
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://qezzykenya.company/#breadcrumb",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Qezzy Surveys Kenya",
      item: "https://qezzykenya.company/",
    },
  ],
};

/** 5. Service Schema — describes the platform as a bookable/joinable service */
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://qezzykenya.company/#service",
  serviceType: "Paid Online Surveys",
  name: "Qezzy Surveys – Earn Money Online Kenya",
  description:
    "Complete paid surveys on your phone and earn real Kenyan shillings. Withdraw instantly to M-Pesa. Free to join. No experience required.",
  provider: { "@id": "https://qezzykenya.company/#organization" },
  areaServed: [
    { "@type": "Country", name: "Kenya" },
    { "@type": "AdministrativeArea", name: "East Africa" },
  ],
  audience: {
    "@type": "Audience",
    audienceType:
      "Kenyans looking for online jobs, work from home, side hustle, earn money online, students, unemployed, graduates",
    geographicArea: { "@type": "Country", name: "Kenya" },
  },
  availableLanguage: ["English", "Swahili"],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Survey Earning Opportunities",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Join Qezzy Surveys — Free",
        description:
          "Sign up for free, complete surveys, and earn real money to your M-Pesa instantly.",
        price: "0",
        priceCurrency: "KES",
        availability: "https://schema.org/InStock",
        url: "https://qezzykenya.company",
      },
    ],
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "47000",
    bestRating: "5",
    worstRating: "1",
  },
};

/* ════════════════════════════════════════════
   ROOT LAYOUT
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
        <meta name="application-name" content="Qezzy Surveys" />
        <meta name="theme-color" content="#F7F3EE" />

        {/* Preconnect to Google Fonts CDN for faster font loads */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* ── Site-wide JSON-LD Schemas ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteNavigationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(serviceSchema),
          }}
        />
      </head>

      <body className="bg-bg text-text font-body antialiased">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}