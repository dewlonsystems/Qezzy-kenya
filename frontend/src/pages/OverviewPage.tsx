// src/pages/OverviewPage.tsx
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { WalletOverview, Job } from '../types';

// Types for derived data
type Transaction = {
  id: string;
  amount: number;
  type: 'main' | 'referral';
  created_at: string;
  description: string;
};

type ActivityItem = {
  id: string;
  type: 'job' | 'referral' | 'withdrawal';
  title: string;
  amount?: number;
  date: string;
  status?: string;
  relatedId: string;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
};

const formatKES = (amount: number) => `KES ${amount.toFixed(2)}`;

const OverviewPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [wallets, setWallets] = useState<WalletOverview | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [referralTransactions, setReferralTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [mainTransactions, setMainTransactions] = useState<Transaction[]>([]);
  const [referralWalletTransactions, setReferralWalletTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [showMainBalance, setShowMainBalance] = useState(false);
  const [showReferralBalance, setShowReferralBalance] = useState(false);

  // === DERIVED DATA ===
  const jobStatusCounts = useMemo(() => {
    const counts = { open: 0, submitted: 0, completed: 0, cancelled: 0, declined: 0 };
    jobs.forEach(job => {
      if (counts.hasOwnProperty(job.status)) {
        counts[job.status as keyof typeof counts] += 1;
      }
    });
    return counts;
  }, [jobs]);

  const jobsCompletedThisMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return jobs.filter(job =>
      job.status === 'completed' &&
      new Date(job.created_at) >= startOfMonth
    ).length;
  }, [jobs]);

  // Combine all activity sources
  const recentActivity = useMemo<ActivityItem[]>(() => {
    const all: ActivityItem[] = [];

    // Add jobs
    jobs.slice(0, 5).forEach(job => {
      all.push({
        id: `job-${job.id}`,
        type: 'job',
        title: job.title,
        date: job.created_at,
        status: job.status,
        relatedId: String(job.id),
      });
    });

    // Add referrals
    referralTransactions.slice(0, 3).forEach(tx => {
      all.push({
        id: `ref-${tx.id}`,
        type: 'referral',
        title: 'Referral Reward',
        amount: tx.amount,
        date: tx.created_at,
        relatedId: tx.id,
      });
    });

    // Add withdrawals
    withdrawals.slice(0, 2).forEach(wd => {
      all.push({
        id: `wd-${wd.id}`,
        type: 'withdrawal',
        title: 'Withdrawal Request',
        amount: wd.amount,
        date: wd.created_at,
        status: wd.status,
        relatedId: wd.id,
      });
    });

    // Sort by date (newest first)
    return all
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [jobs, referralTransactions, withdrawals]);

  // Earnings timeline (last 30 days)
  const earningsTimeline = useMemo(() => {
    const combined = [...mainTransactions, ...referralWalletTransactions]
      .map(tx => ({
        date: new Date(tx.created_at).toISOString().split('T')[0], // YYYY-MM-DD
        amount: tx.amount,
        type: tx.type,
      }))
      .filter(item => {
        const txDate = new Date(item.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return txDate >= thirtyDaysAgo;
      });

    // Group by date
    const grouped: Record<string, { main: number; referral: number }> = {};
    combined.forEach(({ date, amount, type }) => {
      if (!grouped[date]) grouped[date] = { main: 0, referral: 0 };
      grouped[date][type] += amount;
    });

    return Object.entries(grouped)
      .map(([date, { main, referral }]) => ({ date, main, referral }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [mainTransactions, referralWalletTransactions]);

  // === FETCH ALL DATA ===
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
          api.get('/referrals/transactions/'),
          api.get('/withdrawals/history/'),
          api.get('/wallets/transactions/?wallet=main'),
          api.get('/wallets/transactions/?wallet=referral'),
        ]);

        setWallets(walletRes.data);
        setJobs(jobsRes.data);
        setReferralTransactions(referralRes.data);
        setWithdrawals(withdrawalsRes.data.results || withdrawalsRes.data); // handle pagination
        setMainTransactions(
          (mainTxRes.data.results || mainTxRes.data).map((tx: any) => ({
            ...tx,
            type: 'main' as const,
          }))
        );
        setReferralWalletTransactions(
          (refTxRes.data.results || refTxRes.data).map((tx: any) => ({
            ...tx,
            type: 'referral' as const,
          }))
        );
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

  if (loading) {
    return (
      <div className="relative min-h-[400px]">
        <div className="absolute inset-0 bg-amber-50 rounded-tl-xl opacity-80"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ===== 1. Greeting Banner ===== */}
        <div
          className={`rounded-xl p-6 text-white font-bold text-xl ${
            currentUser?.is_active ? 'bg-green-500' : 'bg-yellow-500'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <span>
              {getGreeting()}, {currentUser?.first_name || 'User'}!
            </span>
            {!currentUser?.is_active && (
              <button
                onClick={handleActivate}
                className="mt-3 md:mt-0 px-4 py-2 bg-white text-yellow-700 font-semibold rounded-lg hover:bg-gray-100 transition shadow"
              >
                Activate Now
              </button>
            )}
          </div>
        </div>

        {/* ===== 2. Wallet Summary Cards ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => navigate('/wallet')}
            className="bg-white rounded-xl p-6 shadow hover:shadow-md transition cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Main Wallet</h2>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {showMainBalance
                    ? formatKES(wallets?.main_wallet_balance || 0)
                    : '••••••'}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMainBalance(!showMainBalance);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
                aria-label={showMainBalance ? 'Hide balance' : 'Show balance'}
              >
                {showMainBalance ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          <div
            onClick={() => navigate('/wallet?tab=referral')}
            className="bg-white rounded-xl p-6 shadow hover:shadow-md transition cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Referral Wallet</h2>
                <p className="text-3xl font-bold text-success-600 mt-2">
                  {showReferralBalance
                    ? formatKES(wallets?.referral_wallet_balance || 0)
                    : '••••••'}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReferralBalance(!showReferralBalance);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
                aria-label={showReferralBalance ? 'Hide balance' : 'Show balance'}
              >
                {showReferralBalance ? '👁️' : '🔒'}
              </button>
            </div>
          </div>
        </div>

        {/* ===== 3. Insight Panels ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-700">Jobs Completed</p>
            <p className="text-2xl font-bold text-blue-900">{jobsCompletedThisMonth} this month</p>
          </div>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-sm text-green-700">Total Earnings</p>
            <p className="text-2xl font-bold text-green-900">
              {formatKES((wallets?.main_wallet_balance || 0) + (wallets?.referral_wallet_balance || 0))}
            </p>
          </div>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <p className="text-sm text-purple-700">Total Jobs</p>
            <p className="text-2xl font-bold text-purple-900">{jobs.length}</p>
          </div>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <p className="text-sm text-amber-700">Referral Rewards</p>
            <p className="text-2xl font-bold text-amber-900">{referralTransactions.length}</p>
          </div>
        </div>

        {/* ===== 4. Job Status Distribution ===== */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Job Status Overview</h2>
          <div className="flex items-end justify-between h-32 gap-2">
            {Object.entries(jobStatusCounts).map(([status, count]) => {
              const percentage = jobs.length ? (count / jobs.length) * 100 : 0;
              const colors: Record<string, string> = {
                open: 'bg-blue-500',
                submitted: 'bg-yellow-500',
                completed: 'bg-green-500',
                cancelled: 'bg-gray-500',
                declined: 'bg-red-500',
              };
              const label = status.charAt(0).toUpperCase() + status.slice(1);
              return (
                <div
                  key={status}
                  className="flex flex-col items-center flex-1 group cursor-pointer"
                  onClick={() => navigate(`/jobs?status=${status}`)}
                >
                  <div
                    className={`${colors[status] || 'bg-gray-400'} w-full rounded-t group-hover:opacity-90 transition`}
                    style={{ height: `${Math.max(percentage, 4)}%` }}
                  />
                  <span className="text-xs text-gray-600 mt-2 group-hover:underline">{label}</span>
                  <span className="text-xs font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== 5. Earnings Timeline (Last 30 Days) ===== */}
        {earningsTimeline.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Earnings (Last 30 Days)</h2>
            <div className="overflow-x-auto">
              <div className="min-w-full h-48 flex items-end gap-1 px-2">
                {earningsTimeline.map((day) => {
                  const total = day.main + day.referral;
                  const maxTotal = Math.max(...earningsTimeline.map(d => d.main + d.referral));
                  const height = total > 0 ? (total / maxTotal) * 100 : 4;
                  return (
                    <div
                      key={day.date}
                      className="flex flex-col items-center flex-1 group cursor-pointer"
                      onClick={() => {
                        // Could navigate to /wallet with date filter
                        alert(`View earnings on ${day.date}`);
                      }}
                    >
                      <div className="relative w-full flex flex-col items-center">
                        <div
                          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap"
                        >
                          Main: {formatKES(day.main)}<br/>
                          Ref: {formatKES(day.referral)}
                        </div>
                        <div className="w-full bg-gray-200 rounded-t flex flex-col">
                          <div
                            className="bg-gradient-to-t from-primary-500 to-primary-300 rounded-t transition"
                            style={{ height: `${height}%` }}
                          />
                          {day.referral > 0 && (
                            <div
                              className="bg-gradient-to-t from-success-500 to-success-300 rounded-t"
                              style={{ height: `${(day.referral / total) * height}%` }}
                            />
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-2">{new Date(day.date).getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===== 6. Recent Activity ===== */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-600">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => {
                    if (item.type === 'job') navigate(`/jobs/${item.relatedId}`);
                    else if (item.type === 'referral') navigate('/wallet?tab=referral');
                    else if (item.type === 'withdrawal') navigate('/wallet');
                  }}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {item.amount && (
                      <span className="text-sm font-medium">
                        {formatKES(item.amount)}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.type === 'job' ? 'bg-blue-100 text-blue-800' :
                      item.type === 'referral' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {item.type}
                    </span>
                    {item.status && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;