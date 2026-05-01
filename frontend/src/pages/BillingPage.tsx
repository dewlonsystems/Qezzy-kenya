import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

// ─── Icon Components ───────────────────────────────────────────────────────────

const ZapIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const SmartphoneIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12" y2="18" />
  </svg>
);

const ShieldIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const CheckCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ArrowRightIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const DownloadIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// ─── Types ─────────────────────────────────────────────────────────────────────

// FIX 4: 'success' is now a real state that gets set, not just implied by successCountdown
type BillingState = 'intro' | 'processing' | 'success';

interface PlanData {
  planId: number;
  planName: string;
  amount: number;
  duration: number;
  features?: string[];
  isTrial?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const BillingPage = () => {
  const { currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const planData = location.state as PlanData | null;

  const [state, setState] = useState<BillingState>('intro');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState<number | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const pollCountRef = useRef(0);
  const pollIntervalRef = useRef<number | null>(null);

  // Redirect if the user already has this plan active (and we're not on the success screen)
  useEffect(() => {
    if (currentUser?.subscription?.plan?.id === planData?.planId && state !== 'success') {
      navigate('/overview', { replace: true });
    }
  }, [currentUser, planData, state, navigate]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Auto-redirect after success countdown
  useEffect(() => {
    if (successCountdown === null) return;
    if (successCountdown <= 0) {
      navigate('/overview', { replace: true });
      return;
    }
    const timer = setTimeout(
      () => setSuccessCountdown(prev => (prev !== null ? prev - 1 : null)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [successCountdown, navigate]);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return /^(07|01)\d{8}$/.test(cleaned) || /^254(7|1)\d{8}$/.test(cleaned);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
    pollCountRef.current = 0;
  };

  const fetchPaymentStatus = async (txId: string) => {
    try {
      const res = await api.get(`/subscriptions/payment-status/${txId}/`);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch payment status:', err);
      return null;
    }
  };

  // ─── Polling ───────────────────────────────────────────────────────────────

  const startPolling = (txId: string) => {
    if (isPolling) return;
    setIsPolling(true);
    pollCountRef.current = 0;

    const poll = async () => {
      const result = await fetchPaymentStatus(txId);

      if (!result) {
        stopPolling();
        setError('Unable to verify payment status. Please contact support.');
        return;
      }

      if (result.status === 'completed') {
        stopPolling();

        // Attempt to fetch the receipt URL from history
        try {
          const historyRes = await api.get('/subscriptions/history/');
          const recentTx = historyRes.data.transactions?.[0];
          if (recentTx?.receipt_available) {
            setReceiptUrl(`/subscriptions/receipt/${recentTx.id}/`);
          }
        } catch (e) {
          console.warn('Failed to fetch receipt info:', e);
        }

        await refreshUser?.();

        // FIX 4: explicitly set state to 'success' so it's always correct
        setState('success');
        setTimeout(() => setSuccessCountdown(10), 300);
        return;
      }

      if (result.status === 'failed' || result.status === 'cancelled') {
        stopPolling();
        setError(result.reason || 'Payment failed or was cancelled. Please try again.');
        return;
      }

      // FIX 3: match the backend's 5-minute STK window (300 × 1 s = 300 s)
      pollCountRef.current += 1;
      if (pollCountRef.current >= 300) {
        stopPolling();
        setError('Payment confirmation timed out. Check your M-Pesa statement and try again.');
      }
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 1000) as unknown as number;
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleInitiatePayment = async () => {
    if (!planData) {
      setError('No plan selected. Please choose a subscription first.');
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Safaricom number (e.g. 0712345678)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/subscriptions/subscribe/', {
        plan_id: planData.planId,
        phone_number: phoneNumber,
        use_trial: planData.isTrial || false,
      });

      console.log('STK Push initiated:', res.data);
      const txId = res.data.transaction_id;
      setState('processing');

      if (txId) {
        startPolling(txId);
      } else {
        setError('Unable to verify payment transaction. Please try again.');
      }
    } catch (err: any) {
      console.error('Subscription payment error:', err);
      setError(err.response?.data?.error || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // FIX 2: clear the interval before resetting state so old pollers can't leak
  const handleRetry = () => {
    stopPolling();
    setError('');
    setState('intro');
  };

  const handleCancel = () => {
    stopPolling();
    navigate('/subscriptions', { replace: true });
  };

  const handleDownloadReceipt = async () => {
    if (!receiptUrl) return;
    try {
      const response = await fetch(receiptUrl, {
        headers: { Authorization: `Bearer ${localStorage.getItem('firebase_id_token')}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Qezzy_Receipt_${planData?.planName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error('Failed to download receipt:', e);
      setError('Failed to download receipt. Please contact support.');
    }
  };

  // ─── Render: Success ───────────────────────────────────────────────────────

  if (state === 'success' && planData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center shadow-lg mb-6">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful! 🎉</h1>
          <p className="text-gray-600 mb-2">
            Your <strong>{planData.planName}</strong> subscription is now active.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            KES {planData.amount} • {planData.duration} days • Auto-renews
          </p>

          {receiptUrl && (
            <button
              onClick={handleDownloadReceipt}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors mb-6"
            >
              <DownloadIcon className="w-4 h-4" />
              Download Receipt
            </button>
          )}

          {successCountdown !== null && (
            <p className="text-sm text-gray-500 mb-8">
              Redirecting to dashboard in {successCountdown} second{successCountdown !== 1 ? 's' : ''}…
            </p>
          )}

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

  // ─── Render: Processing ────────────────────────────────────────────────────

  if (state === 'processing' && planData) {
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
              <span className="font-medium text-gray-700">Waiting for payment confirmation…</span>
            </div>
            <div className="text-left space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Check your phone for the M-Pesa prompt</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Enter your M-Pesa PIN to confirm <strong>KES {planData.amount}</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>Wait for confirmation (usually instant)</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRetry}
              className="flex-1 py-3 px-4 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: No Plan ───────────────────────────────────────────────────────

  if (!planData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-4">No Plan Selected</h1>
          <p className="text-gray-600 mb-6">Please choose a subscription plan first.</p>
          <button
            onClick={() => navigate('/subscriptions')}
            className="py-3 px-6 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: Intro / Payment Form ─────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <section className="bg-gradient-to-br from-amber-500 to-amber-600 text-white px-4 pt-12 pb-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 mx-auto flex items-center justify-center mb-6">
            <ZapIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
          <p className="text-white/90">Secure payment via M-Pesa STK Push</p>
        </div>
      </section>

      <div className="px-4 -mt-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">

            {/* Plan Summary */}
            <div className="p-6 border-b border-gray-200 bg-amber-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Selected Plan</span>
                <span className="text-lg font-bold text-amber-700">{planData.planName}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="text-3xl font-bold text-gray-800">KES {planData.amount}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {planData.duration}-day subscription • {planData.isTrial ? 'Trial period' : 'Auto-renews'}
              </p>
            </div>

            {/* Features List */}
            {planData.features && planData.features.length > 0 && (
              <div className="p-6 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  What's Included
                </p>
                <ul className="space-y-2">
                  {planData.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Payment Form */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700 block mb-1">
                    M-Pesa Phone Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="07XX XXX XXX"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^[0-9\s\-]*$/.test(value)) setPhoneNumber(value);
                      if (error) setError('');
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none ${
                      error && phoneNumber ? 'border-red-500' : 'border-gray-300 focus:ring-amber-400'
                    }`}
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
                  className={`w-full py-3 px-4 font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${
                    validatePhoneNumber(phoneNumber) && !loading
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <ZapIcon className="w-5 h-5" />
                      Pay KES {planData.amount} via M-Pesa
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <ShieldIcon className="w-4 h-4" />
                Secured by Safaricom Daraja API
              </p>
              <button onClick={handleCancel} className="mt-3 text-sm text-gray-600 hover:text-gray-800">
                ← Back to plans
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4 px-4">
            By proceeding, you agree to our{' '}
            <a href="/terms" className="text-amber-600 hover:underline">Terms</a> and{' '}
            <a href="/privacy" className="text-amber-600 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;