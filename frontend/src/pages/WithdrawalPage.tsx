// src/pages/WithdrawalPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import type { WalletOverview } from '../types';

const WithdrawalPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const walletType = (searchParams.get('wallet') as 'main' | 'referral') || 'main';
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wallets, setWallets] = useState<WalletOverview | null>(null);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const res = await api.get('/wallets/overview/');
        setWallets(res.data);
      } catch (err) {
        console.error('Failed to load wallet balance:', err);
        setError('Failed to load wallet balance.');
      }
    };
    fetchWallets();
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

    setLoading(true);

    try {
      // Get user's payout method from backend later — for now, assume mobile
      await api.post('/withdrawals/request/', {
        wallet_type: walletType,
        amount: numAmount,
        method: 'mobile', // In real app, fetch from user profile
      });
      alert('Withdrawal request submitted successfully!');
      navigate('/wallet');
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setError(err.response?.data?.error || 'Failed to request withdrawal.');
    } finally {
      setLoading(false);
    }
  };

  const maxBalance = walletType === 'main' 
    ? wallets?.main_wallet_balance || 0 
    : wallets?.referral_wallet_balance || 0;

  return (
    <div className="min-h-screen bg-app p-4">
      <div className="max-w-md mx-auto">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Withdraw from {walletType === 'main' ? 'Main' : 'Referral'} Wallet
          </h1>
          <p className="text-gray-600 mb-4">
            Current balance: <span className="font-semibold">KES {maxBalance.toFixed(2)}</span>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (KES) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="e.g., 500"
                required
              />
            </div>

            <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
              {walletType === 'main' ? (
                <>
                  <strong>Withdrawal Rules:</strong><br />
                  • Only allowed on the <strong>5th of the month</strong><br />
                  • Limited to <strong>once per month</strong>
                </>
              ) : (
                <>
                  <strong>Withdrawal Rules:</strong><br />
                  • Allowed <strong>once every 24 hours</strong><br />
                  • Minimum amount may apply
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full ${loading ? 'opacity-75' : ''}`}
            >
              {loading ? 'Processing...' : 'Request Withdrawal'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/wallet')}
              className="btn-outline w-full"
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