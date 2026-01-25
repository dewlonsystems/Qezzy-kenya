// src/pages/WithdrawalPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import type { WalletOverview, PaymentDetails } from '../types';

// ====== TYPED SVG ICONS ======
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

const ArrowLeftIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

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

const CheckCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const WithdrawalPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const walletType = (searchParams.get('wallet') as 'main' | 'referral') || 'main';
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMethod, setSuccessMethod] = useState<'mobile' | 'bank' | null>(null); // ✅ Track method
  const [wallets, setWallets] = useState<WalletOverview | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [withdrawMethod, setWithdrawMethod] = useState<'mobile' | 'bank'>('mobile');

  // Fetch wallets and payment details
  useEffect(() => {
    const loadData = async () => {
      try {
        const [walletRes, userRes] = await Promise.all([
          api.get('/wallets/overview/'),
          api.get('/users/me/'),
        ]);

        setWallets(walletRes.data);

        const user = userRes.data;
        const details = {
          payout_method: user.payout_method || 'mobile',
          payout_phone: user.payout_phone || '',
          payout_bank_name: user.payout_bank_name || '',
          payout_bank_branch: user.payout_bank_branch || '',
          payout_account_number: user.payout_account_number || '',
        };
        setPaymentDetails(details);
        setWithdrawMethod(details.payout_method as 'mobile' | 'bank');
      } catch (err) {
        console.error('Failed to load ', err);
        setError('Failed to load wallet or payment details.');
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const balance = walletType === 'main' 
      ? wallets?.main_wallet_balance 
      : wallets?.referral_wallet_balance;

    if (numAmount > (balance || 0)) {
      setError('Insufficient balance');
      return;
    }

    // Validation: Main wallet only on 5th
    if (walletType === 'main') {
      const today = new Date();
      if (today.getDate() !== 5) {
        setError('Main wallet withdrawals are only allowed on the 5th of each month.');
        return;
      }
    }

    setLoading(true);

    try {
      await api.post('/withdrawals/request/', {
        wallet_type: walletType,
        amount: numAmount,
        method: withdrawMethod,
      });
      setSuccess(true);
      setSuccessMethod(withdrawMethod); // ✅ Save method for success screen
      setTimeout(() => navigate('/wallet'), 10000);
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setError(err.response?.data?.error || 'An error occurred while processing your withdrawal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Method-aware Success Screen
  if (success && successMethod) {
    const formattedAmount = parseFloat(amount).toFixed(2);

    let title, message, statusText;

    if (successMethod === 'mobile') {
      title = "Withdrawal Sent!";
      message = `Your withdrawal of KES ${formattedAmount} is on the way.`;
      statusText = "Please wait for an SMS confirmation from M-Pesa.";
    } else {
      title = "Withdrawal Requested!";
      message = `Your request for KES ${formattedAmount} is being processed.`;
      statusText = "Your withdrawal is pending approval. Redirecting to wallet...";
    }

    return (
      <div className="min-h-screen bg-landing-cream font-inter flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Confetti-like background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-4 h-4 bg-amber-400 rounded-full animate-float"></div>
          <div className="absolute top-1/4 right-20 w-3 h-3 bg-orange-400 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-amber-500 rounded-full animate-float"></div>
          <div className="absolute bottom-10 right-10 w-5 h-5 bg-orange-300 rounded-full animate-float-delayed"></div>
        </div>

        <div className="max-w-md w-full text-center z-10 animate-fade-in-up">
          {/* Checkmark */}
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
            <CheckCircleIcon className="w-12 h-12 text-white" />
          </div>

          {/* Dynamic Title & Message */}
          <h2 className="text-2xl font-bold text-landing-heading mb-2">{title}</h2>
          <p className="text-landing-muted mb-6">{message}</p>

          {/* Status Bar */}
          <div className="w-full bg-amber-100 rounded-full h-2 mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-400 to-emerald-500 h-full rounded-full animate-pulse w-full"></div>
          </div>

          {/* Dynamic Status Text */}
          <p className="text-xs text-landing-muted mb-6">{statusText}</p>

          {/* Manual Go to Wallet */}
          <button
            onClick={() => navigate('/wallet')}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-amber-200 transition-all"
          >
            Go to Wallet Now
          </button>
        </div>
      </div>
    );
  }

  const maxBalance = walletType === 'main' 
    ? wallets?.main_wallet_balance || 0 
    : wallets?.referral_wallet_balance || 0;

  const isMainWallet = walletType === 'main';

  return (
    <div className="min-h-screen bg-landing-cream font-inter p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <button
            onClick={() => navigate('/wallet')}
            className="p-2 rounded-xl hover:bg-amber-50 transition-colors text-landing-text"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-landing-heading">Withdraw Funds</h1>
          <div className="w-10"></div>
        </div>

        {/* Wallet Banner */}
        <div 
          className={`relative overflow-hidden rounded-2xl p-6 mb-6 ${
            isMainWallet 
              ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500' 
              : 'bg-gradient-to-br from-orange-400 via-orange-500 to-red-500'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-xl">
                {isMainWallet ? <WalletIcon className="w-5 h-5 text-white" /> : <UsersIcon className="w-5 h-5 text-white" />}
              </div>
              <span className="text-white/90 font-medium text-sm">
                {isMainWallet ? 'Main Wallet' : 'Referral Wallet'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              KES {maxBalance.toFixed(2)}
            </p>
            <p className="text-white/80 text-sm">
              {isMainWallet 
                ? 'Available for withdrawal on the 5th' 
                : 'Withdraw anytime (every 24 hours)'}
            </p>
          </div>
        </div>

        {/* Withdrawal Method */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 mb-6">
          <h2 className="text-lg font-bold text-landing-heading mb-4">Withdraw To</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setWithdrawMethod('mobile')}
              className={`p-4 rounded-xl border-2 transition-all ${
                withdrawMethod === 'mobile'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-amber-100 hover:border-amber-300'
              }`}
            >
              <PhoneIcon className="w-5 h-5 mx-auto text-emerald-600" />
              <p className="font-medium text-landing-heading mt-2 text-sm">M-Pesa</p>
              <p className="text-xs text-landing-muted">Instant</p>
            </button>
            <button
              onClick={() => setWithdrawMethod('bank')}
              className={`p-4 rounded-xl border-2 transition-all ${
                withdrawMethod === 'bank'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-amber-100 hover:border-amber-300'
              }`}
            >
              <BuildingIcon className="w-5 h-5 mx-auto text-blue-600" />
              <p className="font-medium text-landing-heading mt-2 text-sm">Bank</p>
              <p className="text-xs text-landing-muted">1-3 days</p>
            </button>
          </div>

          {/* Payment Details Preview */}
          {paymentDetails && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-landing-muted mb-1">
                {withdrawMethod === 'mobile' ? 'M-Pesa Number' : 'Bank Account'}
              </p>
              <p className="text-sm font-medium">
                {withdrawMethod === 'mobile' 
                  ? (paymentDetails.payout_phone || 'Not set') 
                  : `${paymentDetails.payout_bank_name || '—'} • **** ${paymentDetails.payout_account_number?.slice(-4) || '****'}`}
              </p>
            </div>
          )}
        </div>

        {/* Withdrawal Form */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-landing-heading mb-2">
                Amount (KES)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="50"
                step="1"
                className="w-full px-4 py-3 bg-amber-50/50 border border-amber-100 rounded-xl text-landing-heading placeholder:text-landing-muted focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                placeholder={`Min: KES 50`}
                required
              />
              <div className="flex justify-between text-xs text-landing-muted mt-1">
                <span>Available: KES {maxBalance.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => setAmount(maxBalance.toString())}
                  className="text-amber-600 hover:underline"
                >
                  Withdraw all
                </button>
              </div>
            </div>

            {/* Withdrawal Rules */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              <h3 className="font-bold text-landing-heading text-sm mb-1">
                {isMainWallet ? 'Main Wallet Rules' : 'Referral Wallet Rules'}
              </h3>
              <ul className="text-xs text-landing-muted space-y-1">
                {isMainWallet ? (
                  <>
                    <li>• Withdrawals only on <strong>5th of the month</strong></li>
                    <li>• Processing within 24 hours</li>
                  </>
                ) : (
                  <>
                    <li>• Withdraw <strong>once every 24 hours</strong></li>
                    <li>• Minimum amount: <strong>KES 50</strong></li>
                  </>
                )}
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-amber-200 transition-all ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                  Processing...
                </>
              ) : (
                'Confirm Withdrawal'
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/wallet')}
              className="w-full py-3 bg-white text-landing-heading font-medium rounded-xl border border-amber-200 hover:bg-amber-50 transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalPage;