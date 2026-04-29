/*
  Qezzy Surveys — Landing Page (React)
  ------------------------------------
  Add the Google Fonts link to your index.html <head>, or your layout file:

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
  <link
    href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap"
    rel="stylesheet"
  />

  Images expected in /public (or wherever your static assets live):
    hero.jpg, about.jpg, surveys.jpg, community.jpg, research.jpg,
    mpesa.jpg, testimonial-1.jpg, testimonial-2.jpg, testimonial-3.jpg,
    member-1.jpg through member-5.jpg
*/

import { useState, useEffect } from 'react';
import {
  Menu, X, ArrowRight, CheckCircle, Star, ChevronDown,
  Wallet, PenLine, MousePointerClick, Banknote,
  Shield, Clock, BarChart2, Smartphone, BadgeCheck,
  Phone, Mail, MapPin, Globe, Zap,
} from 'lucide-react';
import { X as XIcon } from 'lucide-react';

// Custom SVG components for social media icons
const FacebookIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.117.63c-.794.297-1.473.645-2.148 1.32-.675.675-1.023 1.354-1.32 2.148-.297.788-.498 1.658-.56 2.936C.015 8.333 0 8.74 0 12s.015 3.667.072 4.947c.062 1.278.263 2.148.56 2.936.297.794.645 1.473 1.32 2.148.675.675 1.354 1.023 2.148 1.32.788.297 1.658.498 2.936.56 1.28.058 1.687.072 4.947.072s3.667-.015 4.947-.072c1.278-.062 2.148-.263 2.936-.56.794-.297 1.473-.645 2.148-1.32.675-.675 1.023-1.354 1.32-2.148.297-.788.498-1.658.56-2.936.058-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.062-1.278-.263-2.148-.56-2.936-.297-.794-.645-1.473-1.32-2.148-.675-.675-1.354-1.023-2.148-1.32-.788-.297-1.658-.498-2.936-.56C15.667.015 15.26 0 12 0zm0 2.16c3.203 0 3.585.009 4.849.070 1.171.054 1.805.244 2.227.408.561.217.96.477 1.382.896.419.42.679.821.896 1.381.164.422.354 1.057.408 2.227.061 1.264.07 1.646.07 4.849s-.009 3.585-.07 4.849c-.054 1.171-.244 1.805-.408 2.227-.217.561-.477.96-.896 1.382-.42.419-.821.679-1.381.896-.422.164-1.057.354-2.227.408-1.264.061-1.646.07-4.849.07s-3.585-.009-4.849-.07c-1.171-.054-1.805-.244-2.227-.408-.561-.217-.96-.477-1.382-.896-.419-.42-.679-.821-.896-1.381-.164-.422-.354-1.057-.408-2.227-.061-1.264-.07-1.646-.07-4.849s.009-3.585.07-4.849c.054-1.171.244-1.805.408-2.227.217-.561.477-.96.896-1.382.42-.419.821-.679 1.381-.896.422-.164 1.057-.354 2.227-.408 1.264-.061 1.646-.07 4.849-.07zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 100-8 4 4 0 000 8zm4.965-10.322a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const LinkedinIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.045-8.733 0-9.652h3.554v1.366c.43-.664 1.199-1.608 2.921-1.608 2.134 0 3.732 1.391 3.732 4.382v5.512zM5.337 9.432c-1.144 0-1.915-.758-1.915-1.707 0-.955.77-1.708 1.963-1.708 1.192 0 1.915.753 1.937 1.708 0 .949-.745 1.707-1.985 1.707zm1.946 11.02H3.391V9.956h3.892v10.496zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
  </svg>
);

/* ─── Data ──────────────────────────────────────────────────────────────── */

const stats = [
  { value: '180,000+',  label: 'Surveys Completed' },
  { value: 'KES 12M+',  label: 'Total Earnings Paid Out' },
  { value: '47,000+',   label: 'Active Members' },
  { value: '< 60 sec',  label: 'Avg M-Pesa Withdrawal Time' },
];

const steps = [
  {
    number: '01',
    Icon: PenLine,
    title: 'Create Your Free Account',
    description:
      'Sign up in under two minutes — no credit card required, no subscription. Fill in your profile details once, and we handle the matching from there.',
  },
  {
    number: '02',
    Icon: MousePointerClick,
    title: 'Accept Surveys That Suit You',
    description:
      'Every invitation shows the estimated time and exact reward before you begin. You choose what to take on. There is no obligation to complete a survey you do not want to, and you can pause and return to most surveys within the session window.',
  },
  {
    number: '03',
    Icon: Banknote,
    title: 'Withdraw Directly to M-Pesa',
    description:
      'Once your balance reaches KES 50, request a withdrawal. The money arrives in your M-Pesa in seconds — not hours, not the next business day. Any time of the day or night.',
  },
];

const faqs = [
  {
    question: 'How quickly do M-Pesa withdrawals arrive?',
    answer:
      'In most cases, within 60 seconds. Withdrawals are processed automatically the moment you submit the request. There is no manual review step, no batch processing window, and no cut-off time. The minimum withdrawal amount is KES 50, and Qezzy charges no fee on your end.',
  },
  {
    question: 'What kinds of surveys are available on Qezzy?',
    answer:
      'You will find a mix of market research studies, consumer feedback questionnaires, academic research surveys, brand health trackers, product concept tests, and social opinion polls. The types vary week to week based on active research campaigns. Most are commissioned by companies actively operating in East Africa.',
  },
  {
    question: 'Is joining Qezzy Surveys completely free?',
    answer:
      'Yes — joining is free and will always be free. There are no premium tiers that unlock more surveys. Every member gets the same access. You earn money by completing surveys; you never pay to participate.',
  },
  {
    question: 'How long does each survey take?',
    answer:
      'Surveys on Qezzy range from 3 minutes for short pulse studies to around 20 minutes for more in-depth research. The estimated time is always displayed on the invitation card before you begin.',
  },
  {
    question: 'Who is eligible to join Qezzy Surveys?',
    answer:
      'Anyone aged 18 and above with an active M-Pesa registered phone number and internet access can sign up. Qezzy is currently live across Kenya with expansion across East Africa actively underway.',
  },
  {
    question: 'What happens if I get screened out midway through a survey?',
    answer:
      'Some surveys are built for specific demographic groups set by the research client. If you do not qualify partway through, you still receive a consolation credit for the time you spent. Your time on Qezzy is never entirely wasted.',
  },
];

const testimonials = [
  {
    name: 'Amina Wanjiru',
    role: 'Secondary School Teacher, Nairobi',
    image: '/testimonial-1.jpg',
    text: 'I started using Qezzy during the school holiday with low expectations. Within two weeks I had earned enough to cover my bus fare for the full term. The M-Pesa withdrawal landed before I even put my phone down.',
    stars: 5,
  },
  {
    name: 'Brian Otieno',
    role: 'University Student, Kisumu',
    image: '/testimonial-2.jpg',
    text: 'I was honestly skeptical. I had tried other platforms that made promises they never kept. My first withdrawal of KES 200 hit my M-Pesa in under a minute. Now I do a few surveys on the matatu every morning without thinking twice.',
    stars: 5,
  },
  {
    name: 'Grace Muthoni',
    role: 'Small Business Owner, Thika',
    image: '/testimonial-3.jpg',
    text: 'What surprised me most is how relevant the surveys actually are. They ask about mobile banking services I use, food brands I buy, apps on my phone. It does not feel like wasted time. It feels like being part of something.',
    stars: 5,
  },
];

const trustItems = [
  { Icon: Shield,      label: 'Data Privacy Protected' },
  { Icon: BadgeCheck,  label: 'Verified Research Partners' },
  { Icon: Zap,         label: 'Instant M-Pesa Payouts' },
  { Icon: Globe,       label: 'Pan-East Africa Coverage' },
];

const navLinks = [
  ['#how-it-works', 'How It Works'],
  ['#features',     'Features'],
  ['#mpesa',        'Withdraw'],
  ['#testimonials', 'Stories'],
  ['#faq',          'FAQ'],
];

const surveyCategories = [
  'Consumer goods & FMCG research',
  'Mobile banking & fintech opinions',
  'Brand perception & awareness studies',
  'Healthcare & public health surveys',
  'Academic & institutional research',
  'Social attitudes & policy polls',
  'Product concept & pricing tests',
  'Media & entertainment preferences',
];

const socialLinks = [
  { Icon: FacebookIcon,  label: 'Facebook' },
  { Icon: XIcon,         label: 'X' },
  { Icon: InstagramIcon, label: 'Instagram' },
  { Icon: LinkedinIcon,  label: 'LinkedIn' },
];

const platformLinks = [
  ['How It Works',       '#how-it-works'],
  ['Survey Categories',  '#features'],
  ['M-Pesa Withdrawals', '#mpesa'],
  ['Member Stories',     '#testimonials'],
  ['FAQ',                '#faq'],
];

const companyLinks = [
  ['About Qezzy',    '/about'],
  ['For Researchers','/researchers'],
  ['Blog',           '/blog'],
  ['Careers',        '/careers'],
  ['Press',          '/press'],
];

const legalLinks = [
  ['Privacy Policy',  '/privacy'],
  ['Terms of Service','/terms'],
  ['Cookie Policy',   '/cookies'],
];

/* ─── Hover helpers ──────────────────────────────────────────────────────── */

function hoverLink(primary = '#C27B3A', base = '#4a3828') {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = primary),
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = base),
  };
}

function hoverOpacity() {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.opacity = '0.88'),
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.opacity = '1'),
  };
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function QezzyLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq]           = useState(null);
  const [scrolled, setScrolled]             = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function toggleFaq(i: number) {
    setActiveFaq(activeFaq === i ? null : i);
  }

  return (
    <>
      {/* Global styles */}
      <style>{`
        html { scroll-behavior: smooth; }
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        .stats-grid > *:not(:first-child) { border-left: 1px solid #ddd4c8; }
        @media (max-width: 1023px) { .stats-grid > * { border-left: none !important; } }
        .faq-list > * + * { border-top: 1px solid #ddd4c8; }
      `}</style>

      <div
        className="min-h-screen overflow-x-hidden"
        style={{ backgroundColor: '#F7F3EE', fontFamily: "'DM Sans', sans-serif", color: '#1a140f' }}
      >

        {/* ═══════════════════════ NAVBAR ═══════════════════════ */}
        <header
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={
            scrolled
              ? { backgroundColor: '#F7F3EE', boxShadow: '0 1px 0 rgba(44,28,14,0.1)' }
              : { backgroundColor: 'transparent' }
          }
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="flex items-center justify-between h-16 md:h-20">

              {/* Logo */}
              <a href="/" className="flex items-center gap-1.5 select-none">
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.45rem', fontWeight: 700, color: '#C27B3A', lineHeight: 1 }}>
                  Qezzy
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#2B6C5A', paddingTop: 3 }}>
                  Surveys
                </span>
              </a>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
                {navLinks.map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    className="text-sm font-medium transition-colors duration-200"
                    style={{ color: '#4a3828' }}
                    {...hoverLink('#C27B3A', '#4a3828')}
                  >
                    {label}
                  </a>
                ))}
              </nav>

              <div className="hidden md:flex items-center gap-3">
                <a
                  href="/login"
                  className="text-sm font-medium px-5 py-2 rounded-full transition-all duration-200"
                  style={{ color: '#2B6C5A', border: '1.5px solid #2B6C5A' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2B6C5A'; e.currentTarget.style.color = '#F7F3EE'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#2B6C5A'; }}
                >
                  Log In
                </a>
                <a
                  href="/signup"
                  className="text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200"
                  style={{ backgroundColor: '#C27B3A', color: '#F7F3EE' }}
                  {...hoverOpacity()}
                >
                  Start Earning Free
                </a>
              </div>

              {/* Hamburger */}
              <button
                className="md:hidden p-2 rounded-lg"
                style={{ color: '#1a140f' }}
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile drawer */}
          {mobileMenuOpen && (
            <div
              className="md:hidden border-t px-5 py-5 flex flex-col gap-1"
              style={{ backgroundColor: '#F7F3EE', borderColor: '#ddd4c8' }}
            >
              {navLinks.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm font-medium py-3 border-b"
                  style={{ color: '#1a140f', borderColor: '#ede7df' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4">
                <a href="/login" className="text-sm font-medium text-center py-3 rounded-full" style={{ color: '#2B6C5A', border: '1.5px solid #2B6C5A' }}>
                  Log In
                </a>
                <a href="/signup" className="text-sm font-semibold text-center py-3 rounded-full" style={{ backgroundColor: '#C27B3A', color: '#F7F3EE' }}>
                  Start Earning Free
                </a>
              </div>
            </div>
          )}
        </header>


        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section className="relative min-h-screen flex items-center" aria-label="Hero">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 w-full pt-20 pb-16 md:pt-0 md:pb-0">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-screen">

              {/* Copy */}
              <div className="max-w-lg lg:max-w-none">
                <div
                  className="inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: '#2B6C5A18', color: '#2B6C5A', letterSpacing: '0.12em', textTransform: 'uppercase' }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#2B6C5A', display: 'inline-block', flexShrink: 0 }} />
                  Live &amp; Paying in Kenya
                </div>

                <h1
                  className="mb-6 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.2rem,5vw,3.75rem)', fontWeight: 700, color: '#1a140f', lineHeight: 1.1 }}
                >
                  Your Opinion Has<br />
                  <em style={{ color: '#C27B3A', fontStyle: 'italic' }}>Always</em> Been<br />
                  Worth Real Money
                </h1>

                <p className="mb-4 leading-relaxed" style={{ color: '#5a4d43', fontSize: '1.05rem', fontWeight: 300, maxWidth: 460 }}>
                  Qezzy Surveys connects everyday Kenyans with businesses and researchers who need honest, ground-level feedback. You complete surveys on your phone at your own pace, earn real shillings with every submission, and withdraw directly to your M-Pesa — no applications, no waiting periods, no middlemen taking a cut.
                </p>
                <p className="mb-10 text-sm leading-relaxed" style={{ color: '#7a6a5e', maxWidth: 400 }}>
                  The minimum withdrawal is just KES 50. Once you hit it, the money moves.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-12">
                  <a
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition-all"
                    style={{ backgroundColor: '#C27B3A', color: '#F7F3EE' }}
                    {...hoverOpacity()}
                  >
                    Create Free Account <ArrowRight size={15} />
                  </a>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium transition-all"
                    style={{ color: '#2B6C5A', border: '1.5px solid #2B6C5A' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2B6C5A10')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    See How It Works
                  </a>
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-5">
                  <div className="flex" style={{ gap: '-10px' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-9 h-9 rounded-full overflow-hidden" style={{ border: '2px solid #F7F3EE', marginLeft: i > 1 ? -10 : 0 }}>
                        <img src={`/member-${i}.jpg`} alt={`Qezzy member ${i}`} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5 mb-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={12} fill="#C27B3A" style={{ color: '#C27B3A' }} />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: '#7a6a5e' }}>
                      Trusted by <strong style={{ color: '#1a140f' }}>47,000+</strong> members across Kenya
                    </p>
                  </div>
                </div>
              </div>

              {/* Hero image */}
              <div className="relative hidden lg:block">
                <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '4/5', maxHeight: 620 }}>
                  <img
                    src="/hero.jpg"
                    alt="Kenyan woman earning money by completing surveys on her smartphone"
                    className="w-full h-full object-cover"
                    fetchPriority="high"
                  />
                </div>

                {/* Floating stat pill */}
                <div
                  className="absolute flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl"
                  style={{ bottom: -16, left: -32, backgroundColor: '#F7F3EE', border: '1px solid #ede7df' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2B6C5A12' }}>
                    <Wallet size={18} style={{ color: '#2B6C5A' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1a140f' }}>KES 850 via M-Pesa</p>
                    <p className="text-xs" style={{ color: '#7a6a5e' }}>Just withdrawn — 43 seconds ago</p>
                  </div>
                </div>

                {/* Decorative circle */}
                <div
                  className="absolute rounded-full opacity-40"
                  style={{ width: 96, height: 96, top: -24, right: -24, backgroundColor: '#C27B3A', zIndex: -1 }}
                />
              </div>

            </div>
          </div>
        </section>


        {/* ═══════════════════════ STATS ═══════════════════════ */}
        <section className="py-10 border-y" style={{ borderColor: '#ddd4c8' }} aria-label="Platform statistics">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 stats-grid">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p
                    className="font-bold mb-1"
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: '#C27B3A' }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#7a6a5e', letterSpacing: '0.1em' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ═══════════════════════ ABOUT ═══════════════════════ */}
        <section className="py-24 lg:py-32" aria-label="About Qezzy Surveys">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Image */}
              <div className="relative order-2 lg:order-1">
                <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: '3/4', maxHeight: 560 }}>
                  <img
                    src="/about.jpg"
                    alt="Survey participant completing an online survey on a mobile phone in Nairobi"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div
                  className="absolute flex flex-col items-center justify-center text-center p-4 rounded-2xl"
                  style={{ bottom: -32, right: -24, width: 160, height: 160, backgroundColor: '#2B6C5A', color: '#F7F3EE' }}
                >
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>3 min</p>
                  <p style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4, opacity: 0.85 }}>
                    Shortest survey available
                  </p>
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2 max-w-lg">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#C27B3A', letterSpacing: '0.15em' }}>
                  What Qezzy Is
                </p>
                <h2
                  className="mb-6"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 700, lineHeight: 1.15, color: '#1a140f' }}
                >
                  A Platform Built on<br />Mutual Respect Between<br />Researchers and People
                </h2>
                <p className="mb-5 leading-relaxed" style={{ color: '#5a4d43', fontWeight: 300 }}>
                  For too long, research companies have collected opinions from everyday people and paid nothing — or close to nothing — in return. Qezzy was built to fix that. We believe that if a business is going to use your feedback to inform a product launch, a pricing decision, or a marketing campaign worth millions, the least they can do is pay you fairly for it.
                </p>
                <p className="mb-5 leading-relaxed text-sm" style={{ color: '#7a6a5e' }}>
                  Every survey on Qezzy is attached to a real research brief from a verified company or institution. We vet the campaigns before they go live, screen out low-effort questionnaires, and make sure the reward reflects the time being asked of you. You are not filling in forms for pennies. You are contributing to decisions that shape the market around you.
                </p>
                <p className="leading-relaxed text-sm" style={{ color: '#7a6a5e' }}>
                  And when you are ready to access your earnings, there are no bank account requirements, no withdrawal windows, and no minimum tenure. Just your M-Pesa number and a button to press.
                </p>

                <div className="mt-10 flex flex-col gap-3">
                  {[
                    'No cost to join, ever',
                    'Surveys matched to your actual profile',
                    'M-Pesa withdrawals processed in real time',
                    'Transparent reward shown before every survey',
                  ].map((point) => (
                    <div key={point} className="flex items-start gap-3">
                      <CheckCircle size={17} style={{ color: '#2B6C5A', flexShrink: 0, marginTop: 2 }} />
                      <span className="text-sm" style={{ color: '#3a2e26' }}>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
        <section
          id="how-it-works"
          className="py-24 lg:py-32 border-t"
          style={{ borderColor: '#ddd4c8' }}
          aria-label="How Qezzy Surveys works"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

            <div className="max-w-xl mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#C27B3A', letterSpacing: '0.15em' }}>
                The Process
              </p>
              <h2
                style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 700, lineHeight: 1.15, color: '#1a140f' }}
              >
                Three Steps Between You and Your First Payout
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-0 relative">
              {/* Connector line */}
              <div
                className="hidden md:block absolute h-px"
                style={{ top: 40, left: '16.5%', right: '16.5%', backgroundColor: '#ddd4c8' }}
                aria-hidden="true"
              />

              {steps.map((step, i) => (
                <div
                  key={step.number}
                  className={`relative flex flex-col ${i > 0 ? 'md:pl-10 lg:pl-14' : ''} ${i < steps.length - 1 ? 'pb-12 md:pb-0 border-b md:border-b-0' : ''} ${i > 0 ? 'pt-12 md:pt-0' : ''}`}
                  style={i < steps.length - 1 ? { borderColor: '#ddd4c8' } : {}}
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-8 relative z-10"
                    style={{ backgroundColor: '#F7F3EE', border: '1.5px solid #ddd4c8' }}
                  >
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#C27B3A' }}>
                      {step.number}
                    </span>
                  </div>
                  <step.Icon size={22} style={{ color: '#2B6C5A', marginBottom: 14 }} />
                  <h3
                    className="mb-3"
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 600, color: '#1a140f', lineHeight: 1.25 }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#5a4d43', fontWeight: 300 }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-all"
                style={{ backgroundColor: '#C27B3A', color: '#F7F3EE' }}
                {...hoverOpacity()}
              >
                Get Started — It's Free <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </section>


        {/* ═══════════════════════ FEATURE: MATCHED SURVEYS ═══════════════════════ */}
        <section
          id="features"
          className="py-24 lg:py-32 border-t"
          style={{ borderColor: '#ddd4c8' }}
          aria-label="Qezzy features"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              <div className="max-w-lg">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#C27B3A', letterSpacing: '0.15em' }}>
                  Smart Matching
                </p>
                <h2
                  className="mb-6"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 700, lineHeight: 1.15, color: '#1a140f' }}
                >
                  Surveys That Actually Belong in Your Life
                </h2>
                <p className="mb-5 leading-relaxed" style={{ color: '#5a4d43', fontWeight: 300 }}>
                  Most survey platforms send you questionnaires about products you have never used, services unavailable in your region, or topics so irrelevant they feel like a waste of effort. Qezzy works differently. When you complete your profile, our matching system uses that information to route you toward surveys where your input is genuinely wanted — and where you are far less likely to be screened out midway.
                </p>
                <p className="leading-relaxed text-sm" style={{ color: '#7a6a5e' }}>
                  This is not just good for you. Research clients get cleaner data from participants who actually know their market. Better quality responses attract better campaigns. Better campaigns mean higher rewards across the platform. It is a system that works better for everyone when the matching is done well — and we have spent significant effort making sure it is.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    { Icon: Clock,       label: 'Time shown upfront' },
                    { Icon: Smartphone,  label: 'Mobile-first design' },
                    { Icon: BarChart2,   label: 'Progress tracked' },
                    { Icon: Globe,       label: 'Swahili & English support' },
                  ].map(({ Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <Icon size={16} style={{ color: '#2B6C5A', flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: '#3a2e26' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: '4/3' }}>
                <img
                  src="/surveys.jpg"
                  alt="Mobile interface of Qezzy Surveys showing matched survey opportunities"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

            </div>
          </div>
        </section>


        {/* ═══════════════════════ FEATURE: RESEARCH IMPACT ═══════════════════════ */}
        <section className="py-24 lg:py-32 border-t" style={{ borderColor: '#ddd4c8' }} aria-label="Research impact">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              <div className="overflow-hidden rounded-2xl order-2 lg:order-1" style={{ aspectRatio: '4/3' }}>
                <img
                  src="/community.jpg"
                  alt="Diverse community of survey participants contributing to market research across East Africa"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="max-w-lg order-1 lg:order-2">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#C27B3A', letterSpacing: '0.15em' }}>
                  Your Voice Matters
                </p>
                <h2
                  className="mb-6"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 700, lineHeight: 1.15, color: '#1a140f' }}
                >
                  The Businesses Listening to You Are the Ones Building Your World
                </h2>
                <p className="mb-5 leading-relaxed" style={{ color: '#5a4d43', fontWeight: 300 }}>
                  Surveys on Qezzy are not academic exercises. The companies behind them are making real decisions — about which products reach the shelves near you, which services get better, and where investments go in the East African market. When you answer a question honestly, you are shaping something that will exist in the real world.
                </p>
                <p className="leading-relaxed text-sm" style={{ color: '#7a6a5e' }}>
                  We partner exclusively with verified organisations. Before any survey goes live on Qezzy, we review the research brief, the institution behind it, and the intended use of the data. Anonymous responses are the default. You are never asked to compromise your privacy for a reward, and your data is never sold to parties outside the agreed research context.
                </p>

                <div className="mt-10 flex flex-col gap-3">
                  {trustItems.map(({ Icon, label }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon size={17} style={{ color: '#2B6C5A', flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: '#3a2e26' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ═══════════════════════ M-PESA ═══════════════════════ */}
        <section
          id="mpesa"
          className="py-24 lg:py-32 border-t"
          style={{ borderColor: '#ddd4c8' }}
          aria-label="M-Pesa withdrawal"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">

              {/* Copy */}
              <div className="max-w-lg">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#C27B3A', letterSpacing: '0.15em' }}>
                  How You Get Paid
                </p>
                <h2
                  className="mb-6"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 700, lineHeight: 1.15, color: '#1a140f' }}
                >
                  Withdrawals to M-Pesa<br />That Actually Take<br />
                  <em style={{ color: '#C27B3A', fontStyle: 'italic' }}>Seconds, Not Days</em>
                </h2>
                <p className="mb-5 leading-relaxed" style={{ color: '#5a4d43', fontWeight: 300 }}>
                  We built our payout system around how Kenya actually works. You have an M-Pesa number. Your friends, your landlord, your supplier — everyone accepts M-Pesa. So that is where your Qezzy earnings go, directly, without routing through a bank account or waiting for a payout cycle to close.
                </p>
                <p className="mb-5 leading-relaxed text-sm" style={{ color: '#7a6a5e' }}>
                  The minimum withdrawal is KES 50 — low enough that you are never holding earnings for longer than you want to. Once you request a withdrawal, the transaction is initiated immediately and you receive an M-Pesa confirmation SMS. Most withdrawals complete in under 60 seconds. There is no transaction fee charged by Qezzy on standard withdrawals.
                </p>
                <p className="leading-relaxed text-sm" style={{ color: '#7a6a5e' }}>
                  Withdrawals are available 24 hours a day, seven days a week. You do not need to wait for business hours or a specific day of the month. When you need your money, it moves.
                </p>

                <div className="mt-10 flex flex-col gap-4">
                  {[
                    ['Minimum withdrawal: KES 50', 'Low threshold so you access earnings quickly'],
                    ['No fee from Qezzy', 'Standard M-Pesa transaction costs may apply from Safaricom'],
                    ['Available 24/7', 'No business-hour restrictions, no batch windows'],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex gap-4 py-4 border-b" style={{ borderColor: '#ede7df' }}>
                      <CheckCircle size={18} style={{ color: '#2B6C5A', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p className="text-sm font-semibold mb-0.5" style={{ color: '#1a140f' }}>{title}</p>
                        <p className="text-xs" style={{ color: '#7a6a5e' }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <a
                    href="/signup"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition-all"
                    style={{ backgroundColor: '#2B6C5A', color: '#F7F3EE' }}
                    {...hoverOpacity()}
                  >
                    Start Earning Today <ArrowRight size={15} />
                  </a>
                </div>
              </div>

              {/* Image */}
              <div className="relative">
                <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: '3/4', maxHeight: 580 }}>
                  <img
                    src="/mpesa.jpg"
                    alt="Person receiving M-Pesa payment from Qezzy Surveys withdrawal on their phone"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Withdrawal confirmation card */}
                <div
                  className="absolute p-4 rounded-2xl shadow-xl"
                  style={{ bottom: 32, right: 0, maxWidth: 240, backgroundColor: '#F7F3EE', border: '1px solid #ede7df' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2B6C5A18' }}>
                      <Wallet size={14} style={{ color: '#2B6C5A' }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: '#2B6C5A' }}>Withdrawal Confirmed</span>
                  </div>
                  <p className="font-bold mb-0.5" style={{ fontSize: '1.2rem', color: '#1a140f' }}>KES 1,250</p>
                  <p className="text-xs" style={{ color: '#7a6a5e' }}>Sent to 07XX XXX XXX &bull; 38 seconds</p>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
        <section
          id="testimonials"
          className="py-24 lg:py-32 border-t"
          style={{ borderColor: '#ddd4c8', backgroundColor: '#f0ece6' }}
          aria-label="Member testimonials"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#C27B3A', letterSpacing: '0.15em' }}>
                  Member Stories
                </p>
                <h2
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 700, lineHeight: 1.15, color: '#1a140f' }}
                >
                  People Across Kenya Are Already Earning
                </h2>
              </div>
              <a
                href="/signup"
                className="text-sm font-medium flex items-center gap-1.5 flex-shrink-0"
                style={{ color: '#C27B3A' }}
              >
                Join them today <ArrowRight size={14} />
              </a>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <article key={t.name} className={`flex flex-col ${i === 1 ? 'md:mt-8' : ''}`}>
                  <p
                    className="mb-4 select-none"
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: '5rem', color: '#C27B3A', lineHeight: 0.8, opacity: 0.25 }}
                    aria-hidden="true"
                  >
                    &ldquo;
                  </p>
                  <p className="text-sm leading-relaxed mb-6 flex-1" style={{ color: '#3a2e26', fontWeight: 300 }}>
                    {t.text}
                  </p>
                  <div className="flex items-center gap-3 pt-5 border-t" style={{ borderColor: '#ddd4c8' }}>
                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid #C27B3A30' }}>
                      <img src={t.image} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1a140f' }}>{t.name}</p>
                      <p className="text-xs" style={{ color: '#7a6a5e' }}>{t.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

          </div>
        </section>


        {/* ═══════════════════════ SURVEY TYPES ═══════════════════════ */}
        <section className="py-24 lg:py-32 border-t" style={{ borderColor: '#ddd4c8' }} aria-label="Survey categories">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#C27B3A', letterSpacing: '0.15em' }}>
                  What You Will Find
                </p>
                <h2
                  className="mb-6"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 700, lineHeight: 1.15, color: '#1a140f' }}
                >
                  Every Week Brings a Fresh Mix of Research to Contribute To
                </h2>
                <p className="leading-relaxed mb-10" style={{ color: '#5a4d43', fontWeight: 300 }}>
                  The research landscape is never static. Qezzy receives new campaigns weekly from consumer goods companies, financial institutions, government research bodies, NGOs, telecom operators, and academic institutions. What that means for you is variety — and a steady stream of new opportunities to earn, regardless of your specific background or location within Kenya.
                </p>

                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  {surveyCategories.map((category) => (
                    <div key={category} className="flex items-start gap-2.5 text-sm" style={{ color: '#3a2e26' }}>
                      <span style={{ color: '#C27B3A', fontSize: '1.1rem', lineHeight: 1.3, flexShrink: 0 }}>&bull;</span>
                      <span>{category}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: '4/3' }}>
                <img
                  src="/research.jpg"
                  alt="Variety of online survey categories available on Qezzy Surveys platform"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

            </div>
          </div>
        </section>


        {/* ═══════════════════════ FAQ ═══════════════════════ */}
        <section
          id="faq"
          className="py-24 lg:py-32 border-t"
          style={{ borderColor: '#ddd4c8' }}
          aria-label="Frequently asked questions"
        >
          <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12">

            <div className="max-w-xl mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#C27B3A', letterSpacing: '0.15em' }}>
                Common Questions
              </p>
              <h2
                style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 700, lineHeight: 1.15, color: '#1a140f' }}
              >
                Everything You Want to Know Before You Start
              </h2>
            </div>

            <div className="flex flex-col faq-list">
              {faqs.map((faq, i) => (
                <div key={i} className="py-5">
                  <button
                    className="w-full flex items-center justify-between gap-4 text-left"
                    onClick={() => toggleFaq(i)}
                    aria-expanded={activeFaq === i}
                  >
                    <span className="text-base font-medium" style={{ color: '#1a140f' }}>
                      {faq.question}
                    </span>
                    <span
                      className="flex-shrink-0 transition-transform duration-300"
                      style={{ transform: activeFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', color: '#C27B3A' }}
                    >
                      <ChevronDown size={18} />
                    </span>
                  </button>
                  {activeFaq === i && (
                    <p
                      className="mt-4 text-sm leading-relaxed"
                      style={{ color: '#5a4d43', fontWeight: 300, maxWidth: 680 }}
                    >
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>

          </div>
        </section>


        {/* ═══════════════════════ CTA BANNER ═══════════════════════ */}
        <section
          className="py-20 lg:py-28 border-t border-b"
          style={{ borderColor: '#ddd4c8', backgroundColor: '#2B6C5A' }}
          aria-label="Call to action"
        >
          <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#a8cfc4', letterSpacing: '0.15em' }}>
              Ready to Begin
            </p>
            <h2
              className="mb-6"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem,4.5vw,3.2rem)', fontWeight: 700, lineHeight: 1.12, color: '#F7F3EE' }}
            >
              You Have Had an Opinion This Whole Time.<br />
              <em style={{ color: '#C27B3A' }}>Now It Can Pay Your Bills.</em>
            </h2>
            <p
              className="mb-10 leading-relaxed"
              style={{ color: '#b8d4cc', fontWeight: 300, fontSize: '1rem', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}
            >
              Creating an account takes two minutes. Your first survey invitation can arrive the same day. And your first M-Pesa withdrawal can land before tonight is over. There is no better moment to start than right now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-semibold transition-all"
                style={{ backgroundColor: '#C27B3A', color: '#F7F3EE' }}
                {...hoverOpacity()}
              >
                Create Your Free Account <ArrowRight size={15} />
              </a>
              <a
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-medium transition-all"
                style={{ color: '#F7F3EE', border: '1.5px solid rgba(247,243,238,0.35)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(247,243,238,0.7)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(247,243,238,0.35)')}
              >
                Learn More First
              </a>
            </div>
            <p className="mt-6 text-xs" style={{ color: '#7aaa9d' }}>No credit card. No commitment. No hidden fees — ever.</p>
          </div>
        </section>


        {/* ═══════════════════════ FOOTER ═══════════════════════ */}
        <footer style={{ backgroundColor: '#1a140f', color: '#b8a99a' }} aria-label="Site footer">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

            {/* Top footer */}
            <div className="py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 border-b" style={{ borderColor: '#2e2420' }}>

              {/* Brand */}
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-1.5 mb-4">
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, color: '#C27B3A' }}>Qezzy</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#2B6C5A', paddingTop: 3 }}>Surveys</span>
                </div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#7a6a5e', maxWidth: 240 }}>
                  Earn real money sharing your opinions. Withdraw instantly to M-Pesa. Free to join, always.
                </p>
                <div className="flex items-center gap-3">
                  {socialLinks.map(({ Icon, label }) => (
                    <a
                      key={label}
                      href="/"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                      style={{ backgroundColor: '#2e2420', color: '#b8a99a' }}
                      aria-label={label}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C27B3A'; e.currentTarget.style.color = '#F7F3EE'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2e2420'; e.currentTarget.style.color = '#b8a99a'; }}
                    >
                      <Icon size={15} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#F7F3EE', letterSpacing: '0.12em' }}>
                  Platform
                </h3>
                <ul className="flex flex-col gap-3">
                  {platformLinks.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-sm transition-colors" style={{ color: '#7a6a5e' }} {...hoverLink('#C27B3A', '#7a6a5e')}>
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#F7F3EE', letterSpacing: '0.12em' }}>
                  Company
                </h3>
                <ul className="flex flex-col gap-3">
                  {companyLinks.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-sm transition-colors" style={{ color: '#7a6a5e' }} {...hoverLink('#C27B3A', '#7a6a5e')}>
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#F7F3EE', letterSpacing: '0.12em' }}>
                  Contact
                </h3>
                <ul className="flex flex-col gap-4">
                  {[
                    { Icon: Mail,    text: 'hello@qezzy.co.ke' },
                    { Icon: Phone,   text: '+254 700 000 000' },
                    { Icon: MapPin,  text: 'Nairobi, Kenya' },
                  ].map(({ Icon, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <Icon size={14} style={{ color: '#C27B3A', flexShrink: 0, marginTop: 2 }} />
                      <span className="text-sm" style={{ color: '#7a6a5e' }}>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Bottom footer */}
            <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs" style={{ color: '#4a3828' }}>
                &copy; {new Date().getFullYear()} Qezzy Surveys. All rights reserved.
              </p>
              <div className="flex items-center gap-5">
                {legalLinks.map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    className="text-xs transition-colors"
                    style={{ color: '#4a3828' }}
                    {...hoverLink('#7a6a5e', '#4a3828')}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>

          </div>
        </footer>

      </div>
    </>
  );
}