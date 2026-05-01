import { Metadata } from 'next';
import HomeClient from './HomeClient';

// ── SEO Metadata ────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Qezzy Surveys | Earn Real Money Sharing Your Opinion in Kenya',
  description:
    'Join 47,000+ Kenyans earning cash for completing surveys. Withdraw instantly to M-Pesa. Free to join, no hidden fees. Start earning today.',
  keywords: ['surveys Kenya', 'earn money online', 'M-Pesa surveys', 'market research', 'Qezzy'],
  openGraph: {
    title: 'Qezzy Surveys | Earn Real Money Sharing Your Opinion',
    description:
      'Complete surveys on your phone, earn real shillings, withdraw to M-Pesa in seconds.',
    type: 'website',
    locale: 'en_KE',
    siteName: 'Qezzy Surveys',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qezzy Surveys | Earn Real Money Sharing Your Opinion',
    description:
      'Join 47,000+ Kenyans earning cash for completing surveys. Withdraw instantly to M-Pesa.',
  },
  alternates: {
    canonical: 'https://qezzy.co.ke',
  },
};

export default function Page() {
  return <HomeClient />;
}