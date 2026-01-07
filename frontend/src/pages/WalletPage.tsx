// src/pages/WalletPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { WalletOverview, Transaction, PaymentDetails } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

// ====== TYPED SVG ICONS ======
const WalletIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
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

const ArrowDownIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const ArrowUpIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const PhoneIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const BuildingIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
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

const ArrowLeftIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const WalletPage = () => {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletOverview | null>(null);
  const [mainTransactions, setMainTransactions] = useState<Transaction[]>([]);
  const [referralTransactions, setReferralTransactions] = useState<Transaction[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'main' | 'referral'>('main');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    payout_method: 'mobile' as 'mobile' | 'bank',
    payout_phone: '',
    payout_bank_name: '',
    payout_bank_branch: '',
    payout_account_number: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [walletRes, mainTxRes, refTxRes, userRes] = await Promise.all([
          api.get('/wallets/overview/'),
          api.get('/wallets/transactions/?wallet=main'),
          api.get('/wallets/transactions/?wallet=referral'),
          api.get('/users/me/'),
        ]);

        setWallets(walletRes.data);
        setMainTransactions(mainTxRes.data || []);
        setReferralTransactions(refTxRes.data || []);

        const user = userRes.data;
        const details: PaymentDetails = {
          payout_method: user.payout_method || 'mobile',
          payout_phone: user.payout_phone || '',
          payout_bank_name: user.payout_bank_name || '',
          payout_bank_branch: user.payout_bank_branch || '',
          payout_account_number: user.payout_account_number || '',
        };
        setPaymentDetails(details);
        setEditForm(details);
      } catch (err) {
        console.error('Failed to load wallet ', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleWithdraw = (walletType: 'main' | 'referral') => {
    navigate(`/withdraw?wallet=${walletType}`);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      if (editForm.payout_method === 'mobile' && !editForm.payout_phone.trim()) {
        setError('Phone number is required');
        return;
      }
      if (editForm.payout_method === 'bank') {
        if (!editForm.payout_bank_name.trim() || 
            !editForm.payout_bank_branch.trim() || 
            !editForm.payout_account_number.trim()) {
          setError('All bank details are required');
          return;
        }
      }

      await api.patch('/onboarding/payment/', {
        payout_method: editForm.payout_method,
        ...(editForm.payout_method === 'mobile' 
          ? { phone_number: editForm.payout_phone }
          : {
              bank_name: editForm.payout_bank_name,
              bank_branch: editForm.payout_bank_branch,
              account_number: editForm.payout_account_number,
            }
        ),
      });

      const updatedDetails: PaymentDetails = {
        payout_method: editForm.payout_method,
        payout_phone: editForm.payout_phone,
        payout_bank_name: editForm.payout_bank_name,
        payout_bank_branch: editForm.payout_bank_branch,
        payout_account_number: editForm.payout_account_number,
      };
      setPaymentDetails(updatedDetails);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save payment details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatTransactionType = (type: string) => {
    const labels: Record<string, string> = {
      'task_payment': 'Task Payment',
      'activation_payment': 'Activation Fee',
      'referral_bonus': 'Referral Bonus',
      'withdrawal': 'Withdrawal',
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // ✅ Fixed: Only one declaration, no typo
  const currentTransactions = activeTab === 'main' ? mainTransactions : referralTransactions;

  // ✅ Safe balance values
  const mainBalance = wallets?.main_wallet_balance || 0;
  const referralBalance = wallets?.referral_wallet_balance || 0;
  const totalEarned = mainBalance + referralBalance;

  // Icons and status helpers
  const getTransactionIcon = (tx: Transaction) => {
    if (tx.transaction_type === 'referral_bonus') {
      return <UsersIcon className="w-5 h-5" />;
    }
    if (tx.amount >= 0) {
      return <ArrowDownIcon className="w-5 h-5" />;
    }
    return <ArrowUpIcon className="w-5 h-5" />;
  };

  const getTransactionColor = (tx: Transaction) => {
    if (tx.transaction_type === 'referral_bonus') return 'bg-orange-100 text-orange-600';
    if (tx.amount >= 0) return 'bg-emerald-100 text-emerald-600';
    return 'bg-amber-100 text-amber-600';
  };

  if (loading) {
    return <LoadingSpinner message="Loading your wallet..." />;
    }

  return (
    <div className="min-h-screen bg-landing-cream font-inter p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header - standalone style */}
        <div className="flex justify-between items-center mb-8 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-landing-text hover:text-amber-600 flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-landing-heading">Wallet</h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>

        {/* Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Main Wallet */}
          <div 
            onClick={() => setActiveTab('main')}
            className={`relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300 ${
              activeTab === 'main' 
                ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-2xl shadow-amber-300 scale-[1.02]' 
                : 'bg-gradient-to-br from-amber-300 to-amber-400 hover:shadow-xl'
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <WalletIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90 font-medium text-sm">Main Wallet</span>
              </div>
              <p className="text-3xl font-bold text-white mb-2">
                KES {mainBalance.toFixed(2)}
              </p>
              <p className="text-white/70 text-sm mb-4">Task earnings balance</p>
              
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <p className="text-white/70">Next withdrawal</p>
                  <p className="text-white font-medium">5th of month</p>
                </div>
                {activeTab === 'main' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleWithdraw('main'); }}
                    className="px-4 py-2 bg-white text-amber-600 font-bold rounded-lg hover:bg-amber-50 transition-colors text-sm"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Referral Wallet */}
          <div 
            onClick={() => setActiveTab('referral')}
            className={`relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300 ${
              activeTab === 'referral' 
                ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 shadow-2xl shadow-orange-300 scale-[1.02]' 
                : 'bg-gradient-to-br from-orange-300 to-orange-400 hover:shadow-xl'
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <UsersIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90 font-medium text-sm">Referral Wallet</span>
              </div>
              <p className="text-3xl font-bold text-white mb-2">
                KES {referralBalance.toFixed(2)}
              </p>
              <p className="text-white/70 text-sm mb-4">Referral bonuses</p>
              
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <p className="text-white/70">Withdraw anytime</p>
                  <p className="text-white font-medium">Every 24 hours</p>
                </div>
                {activeTab === 'referral' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleWithdraw('referral'); }}
                    className="px-4 py-2 bg-white text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition-colors text-sm"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { 
              label: 'Total Earned', 
              value: `KES ${totalEarned.toFixed(2)}`, 
              icon: ArrowDownIcon, 
              color: 'emerald' 
            },
            { 
              label: 'Pending Withdrawal', 
              value: 'KES 0.00', 
              icon: ClockIcon, 
              color: 'blue' 
            },
            { 
              label: 'Referral Earnings', 
              value: `KES ${referralBalance.toFixed(2)}`, 
              icon: UsersIcon, 
              color: 'orange' 
            },
            { 
              label: 'Main Wallet', 
              value: `KES ${mainBalance.toFixed(2)}`, 
              icon: WalletIcon, 
              color: 'amber' 
            },
          ].map((stat, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-4 border border-amber-100 hover:shadow-lg transition-all duration-300"
            >
              <div className={`inline-flex p-2 rounded-xl mb-2 ${
                stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                stat.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                'bg-orange-100 text-orange-600'
              }`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-lg font-bold text-landing-heading">{stat.value}</p>
              <p className="text-xs text-landing-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-landing-heading">Payment Details</h2>
            <button
              onClick={handleEditClick}
              className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-lg hover:bg-amber-200 transition"
            >
              Edit
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              {error && (
                <div className="p-2 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>
              )}

              <div>
                <label className="block text-xs font-medium text-landing-heading mb-1">
                  Payout Method
                </label>
                <div className="flex space-x-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payout_method"
                      checked={editForm.payout_method === 'mobile'}
                      onChange={() => setEditForm({...editForm, payout_method: 'mobile'})}
                      className="mr-1.5"
                    />
                    <span className="text-sm">Mobile Money</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payout_method"
                      checked={editForm.payout_method === 'bank'}
                      onChange={() => setEditForm({...editForm, payout_method: 'bank'})}
                      className="mr-1.5"
                    />
                    <span className="text-sm">Bank Transfer</span>
                  </label>
                </div>
              </div>

              {editForm.payout_method === 'mobile' ? (
                <div>
                  <label className="block text-xs font-medium text-landing-heading mb-1">
                    Phone Number (M-Pesa)
                  </label>
                  <input
                    type="tel"
                    value={editForm.payout_phone}
                    onChange={(e) => setEditForm({...editForm, payout_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-1 focus:ring-amber-400 focus:outline-none text-sm"
                    placeholder="07XXXXXXXX"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-landing-heading mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={editForm.payout_bank_name}
                      onChange={(e) => setEditForm({...editForm, payout_bank_name: e.target.value})}
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-1 focus:ring-amber-400 focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-landing-heading mb-1">
                      Bank Branch
                    </label>
                    <input
                      type="text"
                      value={editForm.payout_bank_branch}
                      onChange={(e) => setEditForm({...editForm, payout_bank_branch: e.target.value})}
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-1 focus:ring-amber-400 focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-landing-heading mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={editForm.payout_account_number}
                      onChange={(e) => setEditForm({...editForm, payout_account_number: e.target.value})}
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-1 focus:ring-amber-400 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-3 py-2 border border-amber-200 text-amber-700 rounded-lg text-sm hover:bg-amber-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-lg text-sm"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            paymentDetails ? (
              <div className="flex items-center gap-4">
                {paymentDetails.payout_method === 'mobile' ? (
                  <>
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                      <PhoneIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-landing-heading text-sm">M-Pesa</p>
                      <p className="text-xs text-landing-muted">{paymentDetails.payout_phone || 'Not set'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                      <BuildingIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-landing-heading text-sm">{paymentDetails.payout_bank_name || '—'}</p>
                      <p className="text-xs text-landing-muted">**** {paymentDetails.payout_account_number?.slice(-4) || '****'}</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-landing-muted text-sm italic">No payment details</div>
            )
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
          <div className="p-5 border-b border-amber-100">
            <h2 className="text-lg font-bold text-landing-heading">Transaction History</h2>
          </div>

          {/* Tabs */}
          <div className="border-b border-amber-100">
            <div className="flex">
              <button
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === 'main'
                    ? 'text-amber-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500' 
                    : 'text-landing-muted hover:text-landing-heading'
                }`}
                onClick={() => setActiveTab('main')}
              >
                Main Wallet
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === 'referral'
                    ? 'text-orange-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-500' 
                    : 'text-landing-muted hover:text-landing-heading'
                }`}
                onClick={() => setActiveTab('referral')}
              >
                Referral Wallet
              </button>
            </div>
          </div>

          {/* Transactions */}
          <div className="divide-y divide-amber-50">
            {currentTransactions.length > 0 ? (
              currentTransactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-amber-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${getTransactionColor(tx)}`}>
                        {getTransactionIcon(tx)}
                      </div>
                      <div>
                        <p className="font-medium text-landing-heading text-sm">
                          {formatTransactionType(tx.transaction_type)}
                        </p>
                        <p className="text-xs text-landing-muted">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        tx.amount >= 0 ? 'text-emerald-600' : 'text-landing-heading'
                      }`}>
                        {tx.amount >= 0 ? '+' : ''}KES {Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        tx.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : tx.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                          {tx.status === 'completed' ? (
                            <CheckCircleIcon className="w-3 h-3" />
                          ) : (
                            <ClockIcon className="w-3 h-3" />
                            )}
                            {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-landing-muted text-sm">
                No transactions yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;