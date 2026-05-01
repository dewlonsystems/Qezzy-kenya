import { Metadata } from 'next';
import HomeClient from './HomeClient';

// ── SEO Metadata ────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Qezzy Surveys Kenya – Earn Money Online | Get Paid for Surveys via M-Pesa',
  description:
    'Join 47,000+ Kenyans earning real money online from home. Complete paid surveys, get paid instantly to M-Pesa. No experience needed. Free to join. Legit online jobs in Kenya — start earning today from your phone.',
  keywords: [
    // Core product
    'surveys Kenya',
    'paid surveys Kenya',
    'online surveys Kenya',
    'earn money surveys Kenya',
    'get paid for surveys Kenya',
    'survey sites that pay in Kenya',
    'legitimate paid surveys Kenya',
    'best survey sites Kenya 2025',
    'Qezzy',
    'Qezzy surveys',
    'Qezzy Kenya',

    // M-Pesa / payments
    'M-Pesa surveys',
    'surveys that pay M-Pesa',
    'earn M-Pesa online',
    'make money M-Pesa Kenya',
    'withdraw to M-Pesa',
    'M-Pesa cash out surveys',
    'instant M-Pesa payment surveys',

    // Work from home / online jobs
    'online jobs Kenya',
    'work from home Kenya',
    'remote jobs Kenya',
    'jobs from home Kenya',
    'online work Kenya',
    'work online Kenya',
    'part time online jobs Kenya',
    'side hustle Kenya',
    'side income Kenya',
    'extra income Kenya',
    'earn from home Kenya',
    'online income Kenya',
    'make money online Kenya',
    'how to make money online in Kenya',
    'legitimate online jobs Kenya',
    'real online jobs Kenya',
    'genuine online jobs Kenya',
    'paying online jobs Kenya',
    'online jobs that pay real money Kenya',
    'no experience online jobs Kenya',
    'online jobs for students Kenya',
    'online jobs for graduates Kenya',
    'online jobs for unemployed Kenya',
    'flexible online jobs Kenya',
    'work from phone Kenya',
    'earn money on phone Kenya',
    'mobile jobs Kenya',

    // Market research / surveys general
    'market research Kenya',
    'paid market research Kenya',
    'consumer surveys Kenya',
    'opinion surveys Kenya',
    'share your opinion get paid Kenya',
    'survey panel Kenya',
    'survey rewards Kenya',
    'survey cash Kenya',

    // Earn money variations
    'earn real money online Kenya',
    'earn cash online Kenya',
    'how to earn money online Kenya',
    'ways to earn money online Kenya',
    'earn money online without investment Kenya',
    'earn money free Kenya',
    'free online earning Kenya',
    'online earning sites Kenya',
    'trusted earning sites Kenya',

    // Gig economy / hustle
    'gig economy Kenya',
    'freelance Kenya',
    'hustle online Kenya',
    'digital jobs Kenya',
    'internet jobs Kenya',
    'data entry jobs Kenya',
    'micro tasks Kenya',
    'task based jobs Kenya',

    // City / regional targeting
    'online jobs Nairobi',
    'earn money online Nairobi',
    'work from home Nairobi',
    'online jobs Mombasa',
    'online jobs Kisumu',
    'online jobs Nakuru',
    'online jobs Eldoret',
    'earn money online East Africa',

    // Intent / question keywords
    'how to earn money online in Kenya for free',
    'which survey sites pay in Kenya',
    'best ways to make money online Kenya',
    'is Qezzy legit',
    'Qezzy reviews',
    'does Qezzy pay',
    'how to make money with surveys in Kenya',
  ],

  openGraph: {
    title: 'Qezzy Surveys Kenya – Earn Real Money Online | Paid Surveys via M-Pesa',
    description:
      'Complete surveys on your phone, earn real Kenyan shillings, withdraw to M-Pesa instantly. Join 47,000+ Kenyans already earning. Free to join — no hidden fees. The #1 legitimate online earning platform in Kenya.',
    type: 'website',
    locale: 'en_KE',
    siteName: 'Qezzy Surveys',
    url: 'https://qezzykenya.company',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Qezzy Surveys Kenya – Earn Real Money Online | M-Pesa Payouts',
    description:
      'Join 47,000+ Kenyans earning from home. Complete surveys, earn cash, withdraw to M-Pesa instantly. Free to join. Legit online jobs Kenya.',
  },

  alternates: {
    canonical: 'https://qezzykenya.company',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },

  category: 'Finance, Online Jobs, Market Research',

  authors: [{ name: 'Qezzy Kenya', url: 'https://qezzykenya.company' }],

  other: {
    'geo.region': 'KE',
    'geo.placename': 'Kenya',
    'geo.position': '-1.286389;36.817223',
    ICBM: '-1.286389, 36.817223',
  },
};

// ── JSON-LD Structured Data ──────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://qezzykenya.company/#website',
      url: 'https://qezzykenya.company',
      name: 'Qezzy Surveys Kenya',
      description:
        'Earn real money online in Kenya by completing surveys. Instant M-Pesa payouts. Free to join.',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://qezzykenya.company/?s={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://qezzykenya.company/#organization',
      name: 'Qezzy Surveys',
      url: 'https://qezzykenya.company',
      description:
        'Kenya\'s leading paid survey platform. Earn money online from home with instant M-Pesa withdrawals.',
      areaServed: {
        '@type': 'Country',
        name: 'Kenya',
      },
      knowsAbout: [
        'Paid Surveys',
        'Online Market Research',
        'Work from Home Jobs',
        'Online Jobs Kenya',
        'M-Pesa Payments',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is Qezzy Surveys legit and do they really pay?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Qezzy Surveys is a legitimate paid survey platform in Kenya. Over 47,000 Kenyans have earned real money and withdrawn directly to M-Pesa.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I earn money online in Kenya with Qezzy?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sign up for free, complete surveys on your phone, earn points for each completed survey, and withdraw your earnings instantly to M-Pesa — no minimum payout threshold.',
          },
        },
        {
          '@type': 'Question',
          name: 'How long does M-Pesa withdrawal take?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Withdrawals to M-Pesa are processed instantly — usually within seconds of your request.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do I need experience to do online surveys in Kenya?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No experience is needed. Anyone in Kenya with a smartphone can join Qezzy for free and start earning money online immediately.',
          },
        },
      ],
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}