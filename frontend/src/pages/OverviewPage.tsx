import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { WalletOverview } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

// ====== TYPES ======
interface Survey {
  id: number;
  title: string;
  status: 'open' | 'closed' | 'completed';
  category: string | { name: string } | null;
  deadline_hours?: number;
  created_at: string;
}

interface SubscriptionStatus {
  has_active_subscription: boolean;
  current_tier: string | null;
  tier_level: number;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  start_date: string | null;
  end_date: string | null;
  grace_end_date: string | null;
  is_trial: boolean;
  auto_renew: boolean;
  plan?: {
    id: number;
    name: string;
    tier_level: number;
    price_kes: string;
    features: string[];
  };
  days_remaining?: number;
  can_access_tier?: number;
}

// ====== TYPED SVG ICONS ======
const WalletIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const TaskIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2V5a2 2 0 0 0 2-2h11" />
  </svg>
);

const UsersIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SparklesIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const TrendUpIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const ClockIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ArrowRightIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ArrowDownIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const EyeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const LockIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// ====== GREETING HELPER ======
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
};

// ====== FORMATTING HELPERS ======
const formatKES = (amount: number) => `KES ${amount.toFixed(2)}`;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
};

const formatName = (name: string | undefined): string => {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const formatJoinDate = (dateString: string | undefined): string => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${month} ${year}`;
};

// Helper to compute balance on a given date
const getBalanceOnDate = (transactions: any[], targetDate: Date): number => {
  const completedTx = transactions
    .filter((tx: any) => tx.status === 'completed')
    .filter((tx: any) => new Date(tx.created_at) <= targetDate)
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (completedTx.length === 0) return 0;
  return completedTx[completedTx.length - 1].running_balance || 0;
};

const OverviewPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [wallets, setWallets] = useState<WalletOverview | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [referralTransactions, setReferralTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [mainTransactions, setMainTransactions] = useState<any[]>([]);
  const [referralWalletTransactions, setReferralWalletTransactions] = useState<any[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Balance toggle for privacy
  const [showMainBalance, setShowMainBalance] = useState(false);
  const [showReferralBalance, setShowReferralBalance] = useState(false);

  // Derived data
  const surveysCompletedThisMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return surveys.filter(survey =>
      survey.status === 'completed' &&
      new Date(survey.created_at) >= startOfMonth
    ).length;
  }, [surveys]);

  const totalReferrals = useMemo(() => referralTransactions.length, [referralTransactions]);

  const activeReferrals = useMemo(() => {
    return referralTransactions.filter(tx =>
      tx.referred_user_is_active &&
      tx.referred_user_is_onboarded &&
      !tx.referred_user_is_closed
    ).length;
  }, [referralTransactions]);

  const recentTransactions = useMemo(() => {
    const all: Array<{
      id: string;
      type: string;
      amount: number;
      isCredit: boolean;
      created_at: string;
      status: string;
    }> = [];

    mainTransactions.slice(0, 3).forEach(tx => {
      all.push({
        id: `main-${tx.id}`,
        type: 'Survey Earning',
        amount: tx.amount,
        isCredit: true,
        created_at: tx.created_at,
        status: 'completed',
      });
    });

    referralWalletTransactions.slice(0, 3).forEach(tx => {
      all.push({
        id: `ref-${tx.id}`,
        type: 'Referral Bonus',
        amount: tx.amount,
        isCredit: true,
        created_at: tx.created_at,
        status: 'completed',
      });
    });

    withdrawals.slice(0, 2).forEach(wd => {
      all.push({
        id: `wd-${wd.id}`,
        type: 'Withdrawal',
        amount: wd.amount,
        isCredit: false,
        created_at: wd.created_at,
        status: wd.status,
      });
    });

    return all
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
      .map(tx => ({
        ...tx,
        formattedAmount: `${tx.isCredit ? '+' : '-'}${formatKES(tx.amount)}`,
        formattedDate: formatDate(tx.created_at),
      }));
  }, [mainTransactions, referralWalletTransactions, withdrawals]);

  const mainWalletGrowth = useMemo(() => {
    if (!mainTransactions.length || !wallets) return 0;
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const currentBalance = wallets.main_wallet_balance || 0;
    const pastBalance = getBalanceOnDate(mainTransactions, weekAgo);

    if (pastBalance === 0) return currentBalance === 0 ? 0 : 100;
    return Math.round(((currentBalance - pastBalance) / pastBalance) * 100);
  }, [mainTransactions, wallets]);

  const referralWalletGrowth = useMemo(() => {
    if (!referralWalletTransactions.length || !wallets) return 0;
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const currentBalance = wallets.referral_wallet_balance || 0;
    const pastBalance = getBalanceOnDate(referralWalletTransactions, weekAgo);

    if (pastBalance === 0) return currentBalance === 0 ? 0 : 100;
    return Math.round(((currentBalance - pastBalance) / pastBalance) * 100);
  }, [referralWalletTransactions, wallets]);

  const availableSurveys = useMemo(() => {
    const getCategoryName = (category: Survey['category']): string => {
      if (!category) return 'Survey';
      if (typeof category === 'string') return category;
      if (typeof category === 'object' && category.name) return category.name;
      return 'Survey';
    };

    return surveys
      .filter(survey => survey.status === 'open')
      .slice(0, 4)
      .map(survey => ({
        id: survey.id,
        title: survey.title,
        category: getCategoryName(survey.category),
        deadline: survey.deadline_hours ? `${survey.deadline_hours}h` : '3d',
      }));
  }, [surveys]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          walletRes,
          surveysRes,
          referralRes,
          withdrawalsRes,
          mainTxRes,
          refTxRes,
          subRes,
        ] = await Promise.all([
          api.get('/wallets/overview/'),
          api.get('/surveys/categories/'),
          api.get('/referrals/transactions/'),
          api.get('/withdrawals/history/'),
          api.get('/wallets/transactions/?wallet=main'),
          api.get('/wallets/transactions/?wallet=referral'),
          api.get('/subscriptions/status/'),
        ]);

        setWallets(walletRes.data);
        setSurveys(Array.isArray(surveysRes.data) ? surveysRes.data : (surveysRes.data.results || []));
        setReferralTransactions(referralRes.data.results || referralRes.data);
        setWithdrawals(withdrawalsRes.data.results || withdrawalsRes.data);
        setMainTransactions(mainTxRes.data.results || mainTxRes.data);
        setReferralWalletTransactions(refTxRes.data.results || refTxRes.data);
        setSubscriptionStatus(subRes.data);
      } catch (error) {
        console.error('Failed to load overview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpgrade = () => {
    navigate('/subscriptions');
  };

  // ====== RENDER ======
  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-landing-cream font-inter py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              <span>Member since {formatJoinDate(currentUser?.created_at)}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-landing-heading tracking-tight">
              {getGreeting()}, {formatName(currentUser?.first_name) || 'User'}.
            </h1>
          </div>
          
          {/* Subscription Status (Sleek Flat Badge) */}
          {subscriptionStatus && (
            <div className={`px-5 py-3 rounded-2xl border flex items-center gap-3 ${
              subscriptionStatus.status === 'expired' ? 'bg-red-50 border-red-200 text-red-800'
              : subscriptionStatus.grace_end_date && new Date(subscriptionStatus.grace_end_date) > new Date() ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-white border-gray-200 text-gray-800'
            }`}>
               <SparklesIcon className={`w-5 h-5 ${subscriptionStatus.tier_level > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
               <div>
                  <p className="text-sm font-bold capitalize">
                    {subscriptionStatus.plan?.name || 'Free'} Tier
                    {subscriptionStatus.is_trial && <span className="ml-2 text-[10px] uppercase tracking-wider bg-green-500 text-white px-2 py-0.5 rounded-full">Trial</span>}
                  </p>
                  {subscriptionStatus.tier_level === 0 && (
                    <button onClick={handleUpgrade} className="text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors">
                      Upgrade to unlock more
                    </button>
                  )}
               </div>
            </div>
          )}
        </div>

        {/* UNIFIED FINANCIAL HUB (The Vault) */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            
            {/* Main Wallet */}
            <div className="p-8 md:p-12 relative group">
              <button 
                onClick={() => setShowMainBalance(!showMainBalance)}
                className="absolute top-8 right-8 p-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              >
                {showMainBalance ? <EyeIcon className="w-5 h-5" /> : <LockIcon className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl">
                  <WalletIcon className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Main Wallet</h2>
              </div>
              
              <div className="mb-4">
                <h3 className="text-5xl md:text-6xl font-black text-landing-heading tracking-tighter">
                  {showMainBalance ? formatKES(wallets?.main_wallet_balance || 0) : '••••••'}
                </h3>
              </div>
              
              <div className="flex items-center gap-4">
                {mainWalletGrowth !== 0 && (
                  <span className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full ${
                    mainWalletGrowth > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <TrendUpIcon className={`w-4 h-4 ${mainWalletGrowth < 0 ? 'rotate-180' : ''}`} />
                    {mainWalletGrowth > 0 ? '+' : ''}{mainWalletGrowth}% vs last week
                  </span>
                )}
                <button 
                  onClick={() => navigate('/wallet')} 
                  className="text-sm font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1 transition-colors"
                >
                  Manage Wallet <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Referral Wallet */}
            <div className="p-8 md:p-12 relative group bg-gray-50/50">
              <button 
                onClick={() => setShowReferralBalance(!showReferralBalance)}
                className="absolute top-8 right-8 p-2 rounded-full bg-white hover:bg-gray-100 border border-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              >
                {showReferralBalance ? <EyeIcon className="w-5 h-5" /> : <LockIcon className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-blue-500 text-white rounded-xl">
                  <UsersIcon className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Referral Earnings</h2>
              </div>
              
              <div className="mb-4">
                <h3 className="text-5xl md:text-6xl font-black text-landing-heading tracking-tighter">
                  {showReferralBalance ? formatKES(wallets?.referral_wallet_balance || 0) : '••••••'}
                </h3>
              </div>
              
              <div className="flex items-center gap-4">
                 {referralWalletGrowth !== 0 && (
                  <span className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full ${
                    referralWalletGrowth > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <TrendUpIcon className={`w-4 h-4 ${referralWalletGrowth < 0 ? 'rotate-180' : ''}`} />
                    {referralWalletGrowth > 0 ? '+' : ''}{referralWalletGrowth}% vs last week
                  </span>
                )}
                <button 
                  onClick={() => navigate('/wallet?tab=referral')} 
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  View Referrals <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* FLAT ACTION BAR */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
          <button 
            onClick={() => navigate('/surveys')}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-sm"
          >
            <TaskIcon className="w-5 h-5" /> Find New Surveys
          </button>
          <button 
            onClick={() => navigate('/wallet')}
            className="flex-1 bg-gray-900 hover:bg-black text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-sm"
          >
            <WalletIcon className="w-5 h-5" /> Withdraw Funds
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-sm"
          >
            <UsersIcon className="w-5 h-5" /> Invite & Earn KES 50
          </button>
        </div>

        {/* SPLIT LAYOUT: TRANSACTIONS & PERFORMANCE/SURVEYS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-fade-in-up animation-delay-600">
          
          {/* Left Column: Ledger (Transactions) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-landing-heading">Recent Ledger</h2>
              <button onClick={() => navigate('/wallet')} className="text-sm font-bold text-gray-500 hover:text-black transition-colors">
                View All History
              </button>
            </div>
            
            <div className="bg-white rounded-3xl p-2 border border-gray-100 shadow-sm">
              {recentTransactions.length > 0 ? (
                <div className="flex flex-col">
                  {recentTransactions.map((tx, index) => (
                    <div key={tx.id} className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl hover:bg-gray-50 transition-colors ${index !== recentTransactions.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          tx.type === 'Withdrawal' ? 'bg-gray-100 text-gray-600' : 
                          tx.type === 'Referral Bonus' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {tx.type === 'Withdrawal' ? <ArrowRightIcon className="w-4 h-4" /> : 
                           tx.type === 'Referral Bonus' ? <UsersIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{tx.type}</p>
                          <p className="text-xs font-medium text-gray-400 mt-0.5">{tx.formattedDate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-lg ${tx.isCredit ? 'text-gray-900' : 'text-gray-500'}`}>
                          {tx.formattedAmount}
                        </p>
                        <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider ${
                          tx.status === 'completed' ? 'text-emerald-500' :
                          tx.status === 'failed' ? 'text-red-500' : 'text-amber-500'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400 font-medium">No ledger entries yet.</div>
              )}
            </div>
          </div>

          {/* Right Column: Performance & Active Surveys */}
          <div className="lg:col-span-5 space-y-12">
            
            {/* Quick Performance Stats */}
            <div>
              <h2 className="text-xl font-bold text-landing-heading mb-6">Performance</h2>
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => navigate('/surveys?status=completed')} className="bg-emerald-500 rounded-3xl p-6 text-white cursor-pointer hover:bg-emerald-600 transition-colors">
                  <TaskIcon className="w-6 h-6 text-emerald-200 mb-4" />
                  <div className="text-4xl font-black mb-1">{surveysCompletedThisMonth}</div>
                  <div className="text-emerald-100 text-sm font-medium">Surveys this month</div>
                </div>
                <div onClick={() => navigate('/wallet?tab=referral')} className="bg-white border border-gray-200 rounded-3xl p-6 text-gray-900 cursor-pointer hover:border-blue-500 transition-colors">
                  <UsersIcon className="w-6 h-6 text-blue-500 mb-4" />
                  <div className="text-4xl font-black mb-1">{activeReferrals} <span className="text-lg text-gray-400 font-medium">/ {totalReferrals}</span></div>
                  <div className="text-gray-500 text-sm font-medium">Active Referrals</div>
                </div>
              </div>
            </div>

            {/* Available Surveys List */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-landing-heading">Up Next</h2>
                <button onClick={() => navigate('/surveys')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {availableSurveys.length > 0 ? (
                  availableSurveys.map((survey) => (
                    <div 
                      key={survey.id} 
                      onClick={() => navigate('/surveys')}
                      className="group flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:border-amber-500 hover:shadow-sm cursor-pointer transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{survey.category}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">{survey.title}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{survey.deadline} left</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 border-2 border-dashed border-gray-200 rounded-3xl text-center">
                    <p className="text-gray-400 font-medium mb-2">You're all caught up!</p>
                    <button onClick={() => navigate('/surveys')} className="text-amber-600 font-bold text-sm">Check for new surveys</button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* UPGRADE PROMO (Flat, bold style) */}
        {subscriptionStatus?.has_active_subscription && subscriptionStatus.tier_level === 0 && (
          <div className="mt-12 bg-amber-500 rounded-[2rem] p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in-up">
            <div className="flex items-start gap-5">
              <div className="p-3 bg-amber-400 rounded-2xl hidden sm:block">
                <SparklesIcon className="w-8 h-8 text-amber-900" />
              </div>
              <div>
                <h3 className="text-2xl font-black mb-2 text-amber-950">Unlock 3x Higher Payments</h3>
                <p className="text-amber-100 font-medium max-w-xl">Upgrade your account to Basic (KES 149/mo) and get access to exclusive, premium-tier surveys directly in your dashboard.</p>
              </div>
            </div>
            <button onClick={handleUpgrade} className="w-full md:w-auto px-8 py-4 bg-amber-950 hover:bg-black text-amber-500 font-black rounded-xl transition-colors whitespace-nowrap">
              View Premium Plans
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default OverviewPage;