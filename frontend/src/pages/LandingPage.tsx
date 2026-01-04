import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Inline SVG Icon Components
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const TaskIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </svg>
);

const CoinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-400">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-amber-500">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <TaskIcon />,
      title: "Complete Tasks",
      description: "Access a variety of paid tasks tailored for the Kenyan market. Simple, straightforward, and rewarding."
    },
    {
      icon: <WalletIcon />,
      title: "Dual Wallet System",
      description: "Manage your earnings with separate wallets for task income and referral bonuses."
    },
    {
      icon: <PhoneIcon />,
      title: "M-Pesa Integration",
      description: "Seamless withdrawals directly to your M-Pesa or bank account. Fast, secure, reliable."
    },
    {
      icon: <UsersIcon />,
      title: "Referral Program",
      description: "Earn KES 50 for every friend you refer who activates their account. Unlimited referrals!"
    },
    {
      icon: <ShieldIcon />,
      title: "Secure & Verified",
      description: "Your data and earnings are protected with enterprise-grade security and Firebase authentication."
    },
    {
      icon: <CoinIcon />,
      title: "Instant Payouts",
      description: "Mobile money withdrawals are processed automatically. Get paid when you want."
    }
  ];

  const steps = [
    { step: "01", title: "Sign Up", description: "Create your free account in minutes using your email or phone number." },
    { step: "02", title: "Complete Profile", description: "Fill in your details and payment information for seamless withdrawals." },
    { step: "03", title: "Activate Account", description: "Make a one-time payment of KES 300 to unlock all earning features." },
    { step: "04", title: "Start Earning", description: "Browse available tasks, complete them, and watch your wallet grow!" }
  ];

  const testimonials = [
    {
      name: "Sarah Njeri",
      location: "Nairobi",
      text: "Qezzy Kenya has changed my life! I earn extra income from home while taking care of my children. The M-Pesa withdrawals are so convenient.",
      avatar: "FW"
    },
    {
      name: "Richard Kenagwa",
      location: "Kisii",
      text: "I was skeptical at first, but after my first withdrawal, I knew this was legit. The referral program alone has earned me over KES 5,000!",
      avatar: "BM"
    },
    {
      name: "Grace Chebet",
      location: "Mombasa",
      text: "As a university student, Qezzy helps me pay for my expenses. The tasks are easy and the platform is very user-friendly.",
      avatar: "GM"
    }
  ];

  return (
    <div className="min-h-screen bg-landing-cream font-inter overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                Qezzy Kenya
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-landing-text hover:text-amber-600 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-landing-text hover:text-amber-600 transition-colors font-medium">How It Works</a>
              <a href="#testimonials" className="text-landing-text hover:text-amber-600 transition-colors font-medium">Reviews</a>
              <Link to="/login" className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all duration-300">
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-landing-text">
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-amber-100">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="block py-2 text-landing-text hover:text-amber-600 font-medium">Features</a>
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="block py-2 text-landing-text hover:text-amber-600 font-medium">How It Works</a>
              <a href="#testimonials" onClick={() => setIsMenuOpen(false)} className="block py-2 text-landing-text hover:text-amber-600 font-medium">Reviews</a>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block w-full py-3 text-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-12 px-4 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-300/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-amber-200/30 to-transparent rounded-full" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 font-medium text-sm mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Trusted by 10,000+ Kenyans
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-landing-heading leading-tight mb-6 animate-fade-in-up">
            Turn Your{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                Spare Time
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 8.5C50 2 150 2 198 8.5" stroke="url(#underline-gradient)" strokeWidth="4" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="underline-gradient" x1="0" y1="0" x2="200" y2="0">
                    <stop stopColor="#F59E0B"/>
                    <stop offset="1" stopColor="#EA580C"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <br />
            Into Real{' '}
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Income
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-landing-muted max-w-3xl mx-auto mb-10 animate-fade-in-up animation-delay-200">
            Join Kenya's fastest-growing task-earning platform. Complete simple tasks, 
            refer friends, and withdraw your earnings instantly via M-Pesa.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up animation-delay-400">
            <Link 
              to="/login" 
              className="group w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-lg shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Start Earning Today
              <ArrowRightIcon />
            </Link>
            <a 
              href="#how-it-works" 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-landing-heading font-bold text-lg shadow-lg hover:shadow-xl border-2 border-amber-200 hover:border-amber-400 hover:-translate-y-1 transition-all duration-300"
            >
              See How It Works
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-landing-muted animate-fade-in-up animation-delay-600">
            <div className="flex items-center gap-2">
              <CheckIcon />
              <span className="text-sm font-medium">Free to Join</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon />
              <span className="text-sm font-medium">Instant M-Pesa Withdrawals</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon />
              <span className="text-sm font-medium">24/7 Support</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 animate-fade-in-up animation-delay-800">
            {[
              { value: "10K+", label: "Active Users" },
              { value: "KES 2M+", label: "Paid Out" },
              { value: "50K+", label: "Tasks Completed" },
              { value: "4.9★", label: "User Rating" }
            ].map((stat, index) => (
              <div key={index} className="p-4 sm:p-6 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-amber-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-landing-muted font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 rounded-full border-2 border-amber-400 flex items-start justify-center pt-2">
            <div className="w-1.5 h-3 rounded-full bg-amber-500 animate-scroll" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm mb-4">
              Why Choose Qezzy
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-landing-heading mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Succeed
              </span>
            </h2>
            <p className="text-lg text-landing-muted max-w-2xl mx-auto">
              We've built a platform that makes earning money online simple, secure, and accessible to everyone in Kenya.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 hover:shadow-2xl hover:shadow-amber-200/50 hover:-translate-y-2 transition-all duration-500"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-amber-500/30">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-landing-heading mb-3">{feature.title}</h3>
                <p className="text-landing-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-32 px-4 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm mb-4">
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-landing-heading mb-4">
              Start Earning in{' '}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                4 Easy Steps
              </span>
            </h2>
            <p className="text-lg text-landing-muted max-w-2xl mx-auto">
              Getting started is quick and simple. Follow these steps and start earning within minutes.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="p-6 sm:p-8 rounded-3xl bg-white shadow-xl border border-amber-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full">
                  <div className="text-5xl sm:text-6xl font-black bg-gradient-to-br from-amber-200 to-amber-400 bg-clip-text text-transparent mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-landing-heading mb-3">{step.title}</h3>
                  <p className="text-landing-muted leading-relaxed">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-amber-300">
                    <ArrowRightIcon />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 hover:-translate-y-1 transition-all duration-300"
            >
              Get Started Now
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* Activation Banner */}
      <section className="py-16 sm:py-24 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6">
            Activate Your Account for Just{' '}
            <span className="underline decoration-4 decoration-amber-200">KES 300</span>
          </h2>
          <p className="text-lg sm:text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
            A one-time activation fee unlocks unlimited earning potential. No hidden charges, no monthly fees. Pay once, earn forever.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {["Lifetime Access", "All Features Unlocked", "Priority Support", "Referral Bonuses"].map((item, index) => (
              <div key={index} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium">
                <CheckIcon />
                {item}
              </div>
            ))}
          </div>
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-amber-600 font-bold text-lg shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300"
          >
            Activate Now
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 sm:py-32 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm mb-4">
              Success Stories
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-landing-heading mb-4">
              Loved by{' '}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Thousands
              </span>
            </h2>
            <p className="text-lg text-landing-muted max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our community members have to say.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
                </div>
                <p className="text-landing-text leading-relaxed mb-6 text-lg">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold shadow-md">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-landing-heading">{testimonial.name}</div>
                    <div className="text-sm text-landing-muted">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="py-20 sm:py-32 px-4 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-200 text-amber-800 font-semibold text-sm mb-4">
                Referral Program
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-landing-heading mb-6">
                Earn{' '}
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  KES 50
                </span>{' '}
                For Every Friend
              </h2>
              <p className="text-lg text-landing-muted mb-8 leading-relaxed">
                Share your unique referral code with friends and family. When they activate their account, 
                you receive KES 50 directly in your referral wallet. There's no limit to how many people you can refer!
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited referrals - no cap on earnings",
                  "Instant credit upon friend's activation",
                  "Withdraw referral earnings every 24 hours",
                  "Track all your referrals in real-time"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-landing-text">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                      <CheckIcon />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                Start Referring
                <ArrowRightIcon />
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 p-8 shadow-2xl shadow-amber-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-2xl bg-white/95 backdrop-blur p-6 sm:p-8 flex flex-col justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <UsersIcon />
                    </div>
                    <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-2">
                      KES 50
                    </div>
                    <div className="text-landing-muted font-medium mb-6">Per Successful Referral</div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="text-sm text-landing-muted mb-1">Your Referral Code</div>
                      <div className="text-2xl font-mono font-bold text-landing-heading tracking-wider">
                        QEZZY2024
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 sm:py-32 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm mb-4">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-landing-heading mb-4">
              Got{' '}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Questions?
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { q: "How do I get paid?", a: "Withdraw your earnings instantly via M-Pesa or bank transfer. Mobile money withdrawals are processed automatically, while bank transfers are processed within 24-48 hours." },
              { q: "Is the KES 300 activation fee refundable?", a: "The activation fee is a one-time payment that gives you lifetime access to all earning features. It is non-refundable but unlocks unlimited earning potential." },
              { q: "How much can I earn?", a: "Your earnings depend on the tasks you complete and referrals you make. Active users earn between KES 5,000 - KES 50,000+ monthly." },
              { q: "When can I withdraw my earnings?", a: "Main wallet withdrawals are available on the 5th of each month. Referral wallet withdrawals can be made every 24 hours." }
            ].map((faq, index) => (
              <div key={index} className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-bold text-landing-heading mb-2">{faq.q}</h3>
                <p className="text-landing-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-32 px-4 bg-gradient-to-br from-landing-heading via-gray-900 to-landing-heading relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 font-medium text-sm mb-8">
            <HeartIcon />
            Join 10,000+ Happy Earners
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6">
            Ready to Start Your{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Earning Journey?
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Don't miss out on the opportunity to earn extra income from the comfort of your home. 
            Sign up now and start earning today!
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-landing-heading font-bold text-xl shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 hover:-translate-y-1 transition-all duration-300"
          >
            Create Free Account
            <ArrowRightIcon />
          </Link>
          <p className="text-gray-400 text-sm mt-6">
            No credit card required • Free to join • Activate when ready
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-landing-heading">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Q</span>
                </div>
                <span className="text-xl font-bold text-white">Qezzy Kenya</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Kenya's premier task-earning platform. Complete tasks, earn money, and withdraw instantly.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {["Home", "Features", "How It Works", "Reviews"].map((link) => (
                  <li key={link}>
                    <a href="#features" className="text-gray-400 hover:text-amber-400 transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/terms" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Cookies Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>dewlonsystems@gmail.com</li>
                <li>+254 728 722 746</li>
                <li>Nairobi, Kenya</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Qezzy Kenya. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;