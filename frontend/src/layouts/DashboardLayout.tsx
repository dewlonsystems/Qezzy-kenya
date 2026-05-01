import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

// ====== TYPED SVG ICONS ======
const OverviewIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const SurveysIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </svg>
);

const WalletIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const SubscriptionsIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ProfileIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 0 0-16 0" />
  </svg>
);

const SupportIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M12 7v2" />
    <path d="M12 13h.01" />
  </svg>
);

const LogoutIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const SearchIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

// Tier badge color mapping
const getTierBadgeStyles = (tierLevel: number) => {
  switch (tierLevel) {
    case 4: return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white'; // Elite
    case 3: return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white'; // Premium
    case 2: return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'; // Standard
    case 1: return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white'; // Basic
    default: return 'bg-gray-100 text-gray-700 border border-gray-200'; // Free
  }
};

const getTierDisplayName = (tierName: string | null | undefined) => {
  if (!tierName) return 'Free';
  return tierName.charAt(0).toUpperCase() + tierName.slice(1);
};

interface SubscriptionStatus {
  has_active_subscription: boolean;
  current_tier: string | null;
  tier_level: number;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  end_date: string | null;
  grace_end_date: string | null;
  is_trial: boolean;
}

const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ UPDATED: Navigation with "Surveys" + "Subscriptions"
  const navItems = [
    { name: 'Overview', path: '/overview', icon: OverviewIcon },
    { name: 'Surveys', path: '/surveys', icon: SurveysIcon }, // ← Renamed from Jobs
    { name: 'Subscriptions', path: '/subscriptions', icon: SubscriptionsIcon }, // ← NEW
    { name: 'Wallet', path: '/wallet', icon: WalletIcon },
    { name: 'Profile', path: '/profile', icon: ProfileIcon },
    { name: 'Support', path: '/support', icon: SupportIcon },
  ];

  // Fetch subscription status for topbar badge
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const res = await api.get('/api/subscriptions/status/');
        setSubscriptionStatus(res.data);
      } catch (err) {
        console.warn('Failed to fetch subscription status:', err);
      }
    };
    fetchSubscriptionStatus();
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🔍 Enhanced search: route to relevant page with query param
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Smart routing based on query content
    const query = searchQuery.toLowerCase();
    if (query.includes('survey') || query.includes('task')) {
      navigate(`/surveys?q=${encodeURIComponent(searchQuery)}`);
    } else if (query.includes('wallet') || query.includes('balance') || query.includes('withdraw')) {
      navigate(`/wallet?q=${encodeURIComponent(searchQuery)}`);
    } else if (query.includes('subscription') || query.includes('plan') || query.includes('upgrade')) {
      navigate(`/subscriptions?q=${encodeURIComponent(searchQuery)}`);
    } else if (query.includes('profile') || query.includes('account')) {
      navigate(`/profile?q=${encodeURIComponent(searchQuery)}`);
    } else {
      // Default to surveys search
      navigate(`/surveys?q=${encodeURIComponent(searchQuery)}`);
    }
    setSearchQuery('');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setDropdownOpen(false);
    }
  };

  const goToProfile = () => {
    navigate('/profile');
    setDropdownOpen(false);
  };

  const goToSupport = () => {
    navigate('/support');
    setDropdownOpen(false);
  };

  const goToSubscriptions = () => {
    navigate('/subscriptions');
    setDropdownOpen(false);
  };

  const getInitials = () => {
    if (!currentUser) return 'U';
    const first = currentUser.first_name?.charAt(0).toUpperCase() || '';
    const last = currentUser.last_name?.charAt(0).toUpperCase() || '';
    return (first + last) || 'U';
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30">
      {/* ===== SIDEBAR ===== */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-amber-50 to-white border-r border-amber-200/50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:z-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-amber-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
                Qezzy
              </span>
              <span className="text-xs text-amber-600/70 -mt-1">Kenya</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 overflow-y-auto flex-1">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-lg shadow-amber-500/30'
                      : 'text-amber-800 hover:bg-amber-100/80'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="shrink-0 p-4 border-t border-amber-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogoutIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-col flex-1 md:ml-64">
        {/* ===== TOPBAR ===== */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-amber-100 sticky top-0 z-10">
          <div className="h-full px-4 flex items-center justify-between gap-4">
            {/* Left: Mobile Menu + Search */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors"
              >
                <MenuIcon />
              </button>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex items-center relative">
                <div className="absolute left-3 text-amber-400">
                  <SearchIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search surveys, wallet, plans..."
                  className="w-40 sm:w-64 lg:w-80 pl-10 pr-4 py-2 bg-amber-50/50 border border-amber-200/50 rounded-xl text-amber-900 placeholder:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-300 transition-all"
                />
              </form>
            </div>

            {/* Right: Subscription Tier Badge + User */}
            <div className="flex items-center gap-3">
              {/* ✅ NEW: Subscription Tier Badge (replaces legacy is_active) */}
              {subscriptionStatus && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getTierBadgeStyles(subscriptionStatus.tier_level)}`}>
                  <div className={`w-2 h-2 rounded-full ${
                    subscriptionStatus.tier_level >= 3 ? 'bg-white/80' : 'bg-current'
                  }`} />
                  <span>{getTierDisplayName(subscriptionStatus.current_tier)}</span>
                  {subscriptionStatus.is_trial && (
                    <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Trial</span>
                  )}
                </div>
              )}

              {/* User Profile */}
              <div className="flex items-center gap-3 pl-3 border-l border-amber-200" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="relative"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/20">
                    {getInitials()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute top-12 right-0 w-52 bg-white border border-amber-200 rounded-xl shadow-lg py-2 z-20">
                    <button
                      onClick={goToProfile}
                      className="w-full text-left px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-50 flex items-center gap-2 rounded-t-xl"
                    >
                      <ProfileIcon className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={goToSubscriptions}
                      className="w-full text-left px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-50 flex items-center gap-2"
                    >
                      <SubscriptionsIcon className="w-4 h-4" />
                      Manage Subscription
                    </button>
                    <button
                      onClick={goToSupport}
                      className="w-full text-left px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-50 flex items-center gap-2"
                    >
                      <SupportIcon className="w-4 h-4" />
                      Support
                    </button>
                    <div className="my-1 border-t border-amber-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-xl"
                    >
                      <LogoutIcon className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;