// src/pages/OverviewPage.tsx
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { WalletOverview, Job } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

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

const AlertCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ArrowRightIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// ✅ NEW: ArrowDownIcon for consistency with WalletPage
const ArrowDownIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
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

// ✅ NEW: Format user's name to "John", not "JOHN" or "john"
const formatName = (name: string | undefined): string => {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

// ✅ UPDATED: Full join date with ordinal day
const formatJoinDate = (dateString: string | undefined): string => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();

  const getOrdinalSuffix = (num: number): string => {
    if (num > 3 && num < 21) return 'th';
    switch (num % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
};

// ✅ Helper to compute balance on a given date
const getBalanceOnDate = (
  transactions: any[],
  targetDate: Date
): number => {
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [referralTransactions, setReferralTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [mainTransactions, setMainTransactions] = useState<any[]>([]);
  const [referralWalletTransactions, setReferralWalletTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Balance toggle for privacy
  const [showMainBalance, setShowMainBalance] = useState(false);
  const [showReferralBalance, setShowReferralBalance] = useState(false);

  // Derived data
  const jobsCompletedThisMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return jobs.filter(job =>
      job.status === 'completed' &&
      new Date(job.created_at) >= startOfMonth
    ).length;
  }, [jobs]);

  const totalReferrals = useMemo(() => referralTransactions.length, [referralTransactions]);

  // ✅ ACCURATE ACTIVE REFERRALS COUNT
  const activeReferrals = useMemo(() => {
    return referralTransactions.filter(tx =>
      tx.referred_user_is_active &&
      tx.referred_user_is_onboarded &&
      !tx.referred_user_is_closed
    ).length;
  }, [referralTransactions]);

  // ✅ FIXED: Sort by real timestamp, consistent styling
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
        type: 'Task Earning',
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
        status: wd.status
      });
    });

    return all
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(tx => ({
        ...tx,
        formattedAmount: `${tx.isCredit ? '+' : '-'}${formatKES(tx.amount)}`,
        formattedDate: formatDate(tx.created_at),
      }));
  }, [mainTransactions, referralWalletTransactions, withdrawals]);

  // ✅ REAL WALLET GROWTH CALCULATIONS
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

  const availableTasks = useMemo(() => {
    const getCategoryName = (category: any): string => {
      if (!category) return 'Task';
      if (typeof category === 'string') return category;
      if (typeof category === 'object' && category.name) return category.name;
      return 'Task';
    };

    return jobs
      .filter(job => job.status === 'open')
      .slice(0, 3)
      .map(job => ({
        id: job.id,
        title: job.title,
        category: getCategoryName(job.category),
        deadline: job.deadline_hours ? `${job.deadline_hours} hours` : '3 days',
      }));
  }, [jobs]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          walletRes,
          jobsRes,
          referralRes,
          withdrawalsRes,
          mainTxRes,
          refTxRes,
        ] = await Promise.all([
          api.get('/wallets/overview/'),
          api.get('/jobs/'),
          api.get('/referrals/transactions/'), // ✅ Now includes user status flags
          api.get('/withdrawals/history/'),
          api.get('/wallets/transactions/?wallet=main'),
          api.get('/wallets/transactions/?wallet=referral'),
        ]);

        setWallets(walletRes.data);
        setJobs(jobsRes.data);
        setReferralTransactions(referralRes.data.results || referralRes.data);
        setWithdrawals(withdrawalsRes.data.results || withdrawalsRes.data);
        setMainTransactions(mainTxRes.data.results || mainTxRes.data);
        setReferralWalletTransactions(refTxRes.data.results || refTxRes.data);
      } catch (error) {
        console.error('Failed to load overview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleActivate = () => {
    navigate('/activation');
  };

  // ====== LOADING ======
  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  // ====== RENDER ======
  return (
    <div className="min-h-screen bg-landing-cream font-inter p-4">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-landing-heading mb-2">
            {getGreeting()}, {formatName(currentUser?.first_name) || 'User'}!
          </h1>
          <p className="text-landing-muted">
            Here's what's happening with your account today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Main Wallet Card */}
          <div
            onClick={() => navigate('/wallet')}
            className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-lg hover:shadow-amber-100 transition-all duration-300 animate-fade-in-up cursor-pointer relative"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMainBalance(!showMainBalance);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={showMainBalance ? 'Hide balance' : 'Show balance'}
            >
              <span className="text-lg">{showMainBalance ? '👁️' : '🔒'}</span>
            </button>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                <WalletIcon className="w-6 h-6" />
              </div>
              {mainWalletGrowth !== 0 && (
                <span className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg ${
                  mainWalletGrowth > 0 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-red-600 bg-red-50'
                }`}>
                  <TrendUpIcon className={`w-5 h-5 ${mainWalletGrowth < 0 ? 'rotate-180' : ''}`} />
                  {mainWalletGrowth > 0 ? '+' : ''}{mainWalletGrowth}%
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-landing-heading mb-1">
              {showMainBalance ? formatKES(wallets?.main_wallet_balance || 0) : '••••••'}
            </h3>
            <p className="text-sm text-landing-muted">Main Wallet</p>
            <p className="text-xs text-landing-muted mt-1">Available for withdrawal</p>
          </div>

          {/* Referral Wallet Card */}
          <div
            onClick={() => navigate('/wallet?tab=referral')}
            className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-lg hover:shadow-amber-100 transition-all duration-300 animate-fade-in-up cursor-pointer relative"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReferralBalance(!showReferralBalance);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={showReferralBalance ? 'Hide balance' : 'Show balance'}
            >
              <span className="text-lg">{showReferralBalance ? '👁️' : '🔒'}</span>
            </button>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                <UsersIcon className="w-6 h-6" />
              </div>
              {referralWalletGrowth !== 0 && (
                <span className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg ${
                  referralWalletGrowth > 0 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-red-600 bg-red-50'
                }`}>
                  <TrendUpIcon className={`w-5 h-5 ${referralWalletGrowth < 0 ? 'rotate-180' : ''}`} />
                  {referralWalletGrowth > 0 ? '+' : ''}{referralWalletGrowth}%
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-landing-heading mb-1">
              {showReferralBalance ? formatKES(wallets?.referral_wallet_balance || 0) : '••••••'}
            </h3>
            <p className="text-sm text-landing-muted">Referral Wallet</p>
            <p className="text-xs text-landing-muted mt-1">From referral bonuses</p>
          </div>

          {/* Tasks Completed */}
          <div
            onClick={() => navigate('/jobs?status=completed')}
            className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-lg hover:shadow-amber-100 transition-all duration-300 animate-fade-in-up cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                <TaskIcon className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <TrendUpIcon className="w-5 h-5" />
                {jobsCompletedThisMonth} this month
              </span>
            </div>
            <h3 className="text-2xl font-bold text-landing-heading mb-1">{jobsCompletedThisMonth}</h3>
            <p className="text-sm text-landing-muted">Tasks Completed</p>
            <p className="text-xs text-landing-muted mt-1">Total completed tasks</p>
          </div>

          {/* Referrals */}
          <div
            onClick={() => navigate('/wallet?tab=referral')}
            className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-lg hover:shadow-amber-100 transition-all duration-300 animate-fade-in-up cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                <UsersIcon className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                {activeReferrals} active
              </span>
            </div>
            <h3 className="text-2xl font-bold text-landing-heading mb-1">{totalReferrals}</h3>
            <p className="text-sm text-landing-muted">Referrals</p>
            <p className="text-xs text-landing-muted mt-1">Active referrals</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden animate-fade-in-up animation-delay-400">
            <div className="p-6 border-b border-amber-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-landing-heading">Recent Transactions</h2>
              <button 
                onClick={() => navigate('/wallet')} 
                className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer"
              >
                View All <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-amber-50">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => {
                  let icon, bgColor, textColor;
                  if (tx.type === 'Withdrawal') {
                    bgColor = 'bg-amber-100';
                    textColor = 'text-amber-600';
                  } else if (tx.type === 'Referral Bonus') {
                    icon = <UsersIcon className="w-5 h-5" />;
                    bgColor = 'bg-orange-100';
                    textColor = 'text-orange-600';
                  } else {
                    // Task Earning
                    icon = <ArrowDownIcon className="w-5 h-5" />;
                    bgColor = 'bg-emerald-100';
                    textColor = 'text-emerald-600';
                  }

                  // Override icon based on status
                  if (tx.status === 'completed') {
                    icon = <CheckCircleIcon className="w-5 h-5" />;
                  } else if (tx.status === 'pending') {
                    icon = <ClockIcon className="w-5 h-5" />;
                  }

                  return (
                    <div key={tx.id} className="p-4 hover:bg-amber-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${bgColor} ${textColor}`}>
                            {icon}
                          </div>
                          <div>
                            <p className="font-medium text-landing-heading">{tx.type}</p>
                            <p className="text-sm text-landing-muted">{tx.formattedDate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${tx.isCredit ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {tx.formattedAmount}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            tx.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : tx.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-landing-muted">
                  No transactions yet.
                </div>
              )}
            </div>
          </div>

          {/* Available Tasks */}
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden animate-fade-in-up animation-delay-600">
            <div className="p-6 border-b border-amber-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-landing-heading">Available Tasks</h2>
              <button 
                onClick={() => navigate('/jobs')} 
                className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer"
              >
                View All <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {availableTasks.length > 0 ? (
                availableTasks.map((task) => (
                  <div key={task.id} onClick={() => navigate('/jobs')} className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 hover:shadow-md transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-1 bg-amber-200 text-amber-800 rounded-lg">
                        {task.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-landing-heading mb-2">{task.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-landing-muted">
                      <ClockIcon className="w-5 h-5" />
                      <span>Expires in {task.deadline}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-landing-muted">
                  No tasks available right now.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up animation-delay-800">
          <div
            onClick={() => navigate('/jobs')} 
            className="group p-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl text-white hover:shadow-xl hover:shadow-amber-200 transition-all duration-300 cursor-pointer"
          >
            <TaskIcon className="w-6 h-6" />
            <h3 className="text-lg font-bold mt-4 mb-2">Find Tasks</h3>
            <p className="text-amber-100 text-sm">Browse available tasks and start earning</p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
              Explore <ArrowRightIcon className="w-4 h-4" />
            </div>
          </div>
          <div 
            onClick={() => navigate('/wallet')} 
            className="group p-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl text-white hover:shadow-xl hover:shadow-emerald-200 transition-all duration-300 cursor-pointer"
          >
            <WalletIcon className="w-6 h-6" />
            <h3 className="text-lg font-bold mt-4 mb-2">Withdraw Funds</h3>
            <p className="text-emerald-100 text-sm">Transfer your earnings to M-Pesa or bank</p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
              Withdraw <ArrowRightIcon className="w-4 h-4" />
            </div>
          </div>
          <div 
            onClick={() => navigate('/profile')} 
            className="group p-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl text-white hover:shadow-xl hover:shadow-blue-200 transition-all duration-300 cursor-pointer"
          >
            <UsersIcon className="w-6 h-6" />
            <h3 className="text-lg font-bold mt-4 mb-2">Invite Friends</h3>
            <p className="text-blue-100 text-sm">Earn KES 50 for every activated referral</p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
              Share <ArrowRightIcon className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Activation Banner */}
        {!currentUser?.is_active && (
          <div className="mt-8 p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl text-white relative overflow-hidden animate-fade-in-up">
            <div className="absolute inset-0 bg-[url('image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjExKSIgY3g9IjIwIiBjeT0iMjAiIHI9IjIiLz48L2c+PC9zdmc+')] opacity-30"></div>
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <AlertCircleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Activate Your Account</h3>
                  <p className="text-amber-100">Pay KES 300 once to unlock unlimited earning potential</p>
                </div>
              </div>
              <button
                onClick={handleActivate}
                className="px-6 py-3 bg-white text-amber-600 font-bold rounded-xl hover:bg-amber-50 transition-colors shadow-lg"
              >
                Activate Now
              </button>
            </div>
          </div>
        )}

        {/* ✅ FULL JOIN DATE */}
        <div className="mt-12 text-center text-landing-muted text-sm">
          Member since {formatJoinDate(currentUser?.created_at)}
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;