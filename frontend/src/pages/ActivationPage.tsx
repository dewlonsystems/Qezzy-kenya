// src/pages/ActivationPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

// Properly typed SVG Icon Components
const ZapIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const SmartphoneIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12" y2="18" />
  </svg>
);

const ShieldIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const CheckCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ArrowRightIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ClockIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const BriefcaseIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const WalletIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M19 7V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" />
    <polyline points="15 3 15 5 17 5 17 3 15 3" />
  </svg>
);

const GiftIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const XIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

type ActivationState = 'intro' | 'payment' | 'processing';

const benefits = [
  {
    icon: BriefcaseIcon,
    title: 'Access Paid Tasks',
    description: 'Unlock hundreds of earning opportunities daily',
  },
  {
    icon: WalletIcon,
    title: 'Withdraw Earnings',
    description: 'Transfer your earnings directly to M-Pesa or bank',
  },
  {
    icon: GiftIcon,
    title: 'Referral Rewards',
    description: 'Earn KES 50 for every friend you refer',
  },
  {
    icon: ShieldIcon,
    title: 'Priority Support',
    description: 'Get faster responses from our support team',
  },
];

const ActivationPage = () => {
  const { currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState<ActivationState>('intro');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState<number | null>(null); // ✅ Top-level state

  const pollCountRef = useRef(0);
  const pollIntervalRef = useRef<number | null>(null);

  // Redirect if already active
  useEffect(() => {
    if (currentUser?.is_active && successCountdown === null) {
      navigate('/overview', { replace: true });
    }
  }, [currentUser, successCountdown, navigate]);

  // Cleanup polling
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // ✅ Auto-redirect after success countdown
  useEffect(() => {
    if (successCountdown === null) return;

    if (successCountdown <= 0) {
      navigate('/overview', { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setSuccessCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [successCountdown, navigate]);

  const fetchActivationStatus = async () => {
    try {
      const res = await api.get('/activation/status/');
      return res.data;
    } catch (err) {
      console.error('Failed to fetch activation status:', err);
      return null;
    }
  };

  const startPolling = () => {
    if (isPolling) return;

    setIsPolling(true);
    pollCountRef.current = 0;

    const poll = async () => {
      const status = await fetchActivationStatus();

      if (!status) {
        setIsPolling(false);
        setError('Unable to verify payment status. Please contact support.');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        return;
      }

      if (status.payment_status === 'completed') {
        setIsPolling(false);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        await refreshUser?.();
         setTimeout(() => {
          setSuccessCountdown(10);
          }, 300);
        return;
      }

      if (status.payment_status === 'failed' || status.payment_status === 'cancelled') {
        setIsPolling(false);
        setError('Payment failed or was cancelled. Please try again.');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        return;
      }

      pollCountRef.current += 1;
      if (pollCountRef.current >= 30) {
        setIsPolling(false);
        setError('Payment confirmation timed out. Check your M-Pesa statement and try again.');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 3000) as unknown as number;
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
  };

  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return /^(07|01)\d{8}$/.test(cleaned) || /^254(7|1)\d{8}$/.test(cleaned);
  };

  const handleInitiatePayment = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Safaricom number (e.g. 0712345678)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/activation/initiate/', { phone_number: phoneNumber });
      console.log('Checkout Request ID:', res.data.checkout_request_id);
      setState('processing');
      startPolling();
    } catch (err: any) {
      console.error('Activation error:', err);
      setError(err.response?.data?.error || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setSkipLoading(true);
    try {
      await api.post('/activation/skip/');
      navigate('/overview', { replace: true });
    } catch (err) {
      setError('Failed to skip activation. Please try again.');
    } finally {
      setSkipLoading(false);
    }
  };

  const goBack = () => {
    setState('intro');
    setError('');
  };

  // ========== RENDER SUCCESS SCREEN ==========
  if (successCountdown !== null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 mx-auto flex items-center justify-center shadow-lg mb-6">
            <CheckCircleIcon className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">You're All Set!</h1>
          <p className="text-gray-600 mb-6">
            Your account is now active. Start earning by completing tasks.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Redirecting to dashboard in {successCountdown} second{successCountdown !== 1 ? 's' : ''}...
          </p>
          <button
            onClick={() => navigate('/overview')}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            Go to Dashboard Now
            <ArrowRightIcon className="w-5 h-5 ml-2 inline" />
          </button>
        </div>
      </div>
    );
  }

  // ========== RENDER OTHER STATES ==========

  if (state === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-amber-50 mx-auto flex items-center justify-center mb-6 animate-pulse">
            <SmartphoneIcon className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Check Your Phone</h1>
          <p className="text-gray-600 mb-4">We've sent an M-Pesa payment request to</p>
          <p className="text-lg font-semibold mb-8">{phoneNumber}</p>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="font-medium text-gray-700">Waiting for payment confirmation...</span>
            </div>
            <ol className="text-sm text-gray-600 text-left space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Check your phone for the M-Pesa prompt</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Enter your M-Pesa PIN to confirm payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>Wait for confirmation (usually instant)</span>
              </li>
            </ol>
          </div>

          {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

          <button
            onClick={() => setState('payment')}
            className="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1 mx-auto"
          >
            <XIcon className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (state === 'payment') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 font-sans">
        <div className="w-full max-w-md mx-auto pt-8">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-8"
          >
            <ArrowRightIcon className="w-4 h-4 rotate-180" />
            Back
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 mx-auto flex items-center justify-center mb-4">
              <SmartphoneIcon className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Pay with M-Pesa</h1>
            <p className="text-gray-600">
              Enter your Safaricom number to receive the payment request
            </p>
          </div>

          {error && <div className="text-red-600 text-sm mb-4 text-center">{error}</div>}

          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <span className="text-gray-600">Activation Fee</span>
              <span className="text-2xl font-bold text-gray-800">KES 300</span>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="text-sm font-medium text-gray-700 block mb-1">
                  M-Pesa Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="07XX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                />
                {phoneNumber && !validatePhoneNumber(phoneNumber) && (
                  <p className="text-xs text-red-600 mt-1.5">
                    Please enter a valid Safaricom number
                  </p>
                )}
              </div>

              <button
                onClick={handleInitiatePayment}
                disabled={!validatePhoneNumber(phoneNumber) || loading}
                className={`w-full py-3 px-4 font-semibold rounded-xl shadow-sm transition-all ${
                  validatePhoneNumber(phoneNumber)
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ZapIcon className="w-5 h-5 mr-2 inline" />
                    Pay KES 300
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-center text-xs text-gray-500">
            <ShieldIcon className="w-4 h-4" />
            <span>Secured by Safaricom</span>
          </div>
        </div>
      </div>
    );
  }

  // Intro state
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <section className="bg-gradient-to-br from-amber-500 to-amber-600 text-white px-4 pt-12 pb-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 mx-auto flex items-center justify-center mb-6">
            <ZapIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Activate Your Account</h1>
          <p className="text-white/90">
            Unlock all features and start earning money by completing simple tasks
          </p>
        </div>
      </section>

      <div className="px-4 -mt-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-6 text-center border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-1">One-time activation fee</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-gray-800">KES 300</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Pay once, earn forever</p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                What you'll unlock
              </p>
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <benefit.icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{benefit.title}</p>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {error && <div className="px-6 pb-2 text-red-600 text-sm text-center">{error}</div>}

            <div className="p-6 pt-2 space-y-3">
              <button
                onClick={() => setState('payment')}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                Activate Now
                <ArrowRightIcon className="w-5 h-5 ml-2 inline" />
              </button>
              <button
                onClick={handleSkip}
                disabled={skipLoading}
                className={`w-full py-3 px-4 font-medium rounded-xl border transition-colors flex items-center justify-center ${
                  skipLoading
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {skipLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Skipping...
                  </>
                ) : (
                  <>
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Skip for now
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4 px-4">
            You can activate later from the dashboard, but you won't be able to
            access tasks or withdraw earnings until then.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivationPage;