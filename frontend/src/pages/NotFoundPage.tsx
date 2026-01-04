import { useLocation } from "react-router-dom";
import { useEffect } from "react";

// Inline SVG Icons
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = 'Page Not Found - Qezzy Kenya';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-landing-cream font-inter relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orb */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-200 via-amber-300 to-orange-200 rounded-full opacity-50 blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-200 via-amber-200 to-yellow-200 rounded-full opacity-50 blur-3xl animate-float-delayed"></div>
        
        {/* Floating shapes */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-amber-400 rounded-full opacity-60 animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-orange-400 rounded-full opacity-40 animate-float-delayed"></div>
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-amber-500 rounded-full opacity-50 animate-float"></div>
        <div className="absolute bottom-1/3 right-1/3 w-5 h-5 bg-orange-300 rounded-full opacity-60 animate-float-delayed"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNDUsIDE1OCwgMTEsIDAuMDUpIiBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] opacity-50"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <a href="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200">
            <span className="text-white font-bold text-lg">Q</span>
          </div>
          <span className="text-xl font-bold text-landing-heading">Qezzy Kenya</span>
        </a>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="text-center max-w-2xl mx-auto">
          {/* 404 Number */}
          <div className="relative mb-8 animate-fade-in-up">
            <span className="text-[180px] md:text-[220px] font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-orange-400 to-amber-600 leading-none select-none">
              404
            </span>
            <div className="absolute inset-0 text-[180px] md:text-[220px] font-black text-amber-200/20 leading-none blur-sm -z-10">
              404
            </div>
          </div>

          {/* Message */}
          <div className="animate-fade-in-up animation-delay-200">
            <h1 className="text-3xl md:text-4xl font-bold text-landing-heading mb-4">
              Oops! Page not found
            </h1>
            <p className="text-lg text-landing-muted mb-8 max-w-md mx-auto">
              The page you're looking for seems to have wandered off. Don't worry, let's get you back on track.
            </p>
          </div>

          {/* Illustration */}
          <div className="mb-10 animate-fade-in-up animation-delay-400">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full relative">
              <svg viewBox="0 0 100 100" className="w-20 h-20 text-amber-500">
                <circle cx="50" cy="40" r="25" fill="currentColor" opacity="0.2" />
                <circle cx="40" cy="35" r="4" fill="currentColor" />
                <circle cx="60" cy="35" r="4" fill="currentColor" />
                <path d="M35 55 Q50 45 65 55" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M30 25 Q35 15 40 25" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M60 25 Q65 15 70 25" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              {/* Decorative ring */}
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-300 animate-spin" style={{ animationDuration: '20s' }}></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-600">
            <a 
              href="/" 
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-amber-200 hover:-translate-y-1 transition-all duration-300"
            >
              <HomeIcon />
              Go to Homepage
            </a>
            <button 
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-8 py-4 bg-white text-landing-heading font-bold rounded-2xl border-2 border-amber-200 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <ArrowLeftIcon />
              Go Back
            </button>
          </div>

          {/* Search Suggestion */}
          <div className="mt-12 animate-fade-in-up animation-delay-800">
            <p className="text-landing-muted text-sm mb-4">Or try searching for what you need:</p>
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                placeholder="Search Qezzy Kenya..."
                className="w-full pl-12 pr-6 py-4 bg-white border-2 border-amber-100 rounded-2xl text-landing-heading placeholder:text-landing-muted focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all shadow-sm"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-landing-muted">
                <SearchIcon />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-amber-100 animate-fade-in-up animation-delay-800">
            <p className="text-landing-muted text-sm mb-4">Popular pages:</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { label: 'Overview', href: '/overview' },
                { label: 'Jobs', href: '/jobs' },
                { label: 'Wallet', href: '/wallet' },
                { label: 'Profile', href: '/profile' },
                { label: 'Support', href: '/support' },
              ].map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="px-4 py-2 bg-amber-50 text-amber-700 font-medium rounded-xl hover:bg-amber-100 hover:text-amber-800 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center p-6 text-sm text-landing-muted">
        <p>© 2026 Qezzy Kenya. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default NotFound;