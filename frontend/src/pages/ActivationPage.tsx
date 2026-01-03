// src/pages/ActivationPage.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import type { ActivationStatus } from '../types';

const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_ATTEMPTS = 30; // Stop after ~90 seconds

const ActivationPage = () => {
  const { currentUser, refreshUser } = useAuth(); 
  const navigate = useNavigate();
  
  const [activationStatus, setActivationStatus] = useState<ActivationStatus | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPolling, setIsPolling] = useState(false);

  const pollCountRef = useRef(0);
  const pollIntervalRef = useRef<number | null>(null);

  // Redirect if already active
  useEffect(() => {
    if (currentUser?.is_active) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const fetchActivationStatus = async (): Promise<ActivationStatus | null> => {
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
      setActivationStatus(status);

      // Stop conditions
      if (!status) {
        // Backend error – stop polling
        setIsPolling(false);
        setError('Unable to verify payment status. Please contact support.');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        return;
      }

      if (status.payment_status === 'completed') {
        // Success!
        setIsPolling(false);
        setSuccess('Payment confirmed! Account activated.');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        
        // Optional: refresh auth context to update currentUser.is_active
        await refreshUser?.();
        
        // Redirect after a short delay for UX
        setTimeout(() => navigate('/', { replace: true }), 1500);
        return;
      }

      if (status.payment_status === 'failed' || status.payment_status === 'cancelled') {
        setIsPolling(false);
        setError('Payment failed or was cancelled. Please try again.');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        return;
      }

      // Continue polling
      pollCountRef.current += 1;
      if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
        setIsPolling(false);
        setError('Payment confirmation timed out. Check your M-Pesa statement and try again.');
        if ( pollIntervalRef.current ) clearInterval(pollIntervalRef.current);
      }
    };

    // Initial poll immediately
    poll();
    // Then poll every X ms
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL);
  };

  // Trigger polling when activation is initiated
  const handleActivate = async () => {
    if (!phoneNumber) {
      setError('Please enter your mobile number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/activation/initiate/', { phone_number: phoneNumber });
      setSuccess('STK Push sent! Check your phone to complete payment.');
      console.log('Checkout Request ID:', res.data.checkout_request_id);
      
      // Start polling for payment confirmation
      startPolling();
    } catch (err: any) {
      console.error('Activation error:', err);
      setError(err.response?.data?.error || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await api.post('/activation/skip/');
      navigate('/', { replace: true });
    } catch (err) {
      setError('Failed to skip activation. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-app p-4">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Activate Your Account</h1>
          <p className="text-gray-600 mb-6">
            Pay a one-time activation fee of <span className="font-semibold">KES 300</span> to unlock full access.
            You’ll earn from tasks and referrals once activated.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          {activationStatus?.payment_status === 'completed' ? (
            <div className="text-center py-6">
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <h2 className="text-xl font-semibold text-gray-800">Activation Successful!</h2>
              <p className="text-gray-600 mt-2">Your account is now active.</p>
              <button
                onClick={() => navigate('/')}
                className="btn-primary mt-4"
              >
                Go to Dashboard
              </button>
            </div>
          ) : isPolling ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-gray-700">Waiting for payment confirmation...</p>
              <p className="text-sm text-gray-500 mt-2">
                Please check your phone and complete the STK prompt.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number for STK Push *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="e.g., 0712345678"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  You’ll receive an STK prompt from Safaricom to complete payment.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleActivate}
                  disabled={loading}
                  className={`btn-primary flex-1 ${loading ? 'opacity-75' : ''}`}
                >
                  {loading ? 'Processing...' : 'Pay KES 300'}
                </button>
                <button
                  onClick={handleSkip}
                  className="btn-outline flex-1"
                >
                  Skip for Now
                </button>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800">Note</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Skipping activation means you can’t access jobs or earnings. 
                  You can activate later from your profile.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivationPage;