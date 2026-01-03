// src/pages/WalletPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { WalletOverview, Transaction, PaymentDetails } from '../types';

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
          api.get('/wallets/transactions/?wallet_type=main'),
          api.get('/wallets/transactions/?wallet_type=referral'),
          api.get('/users/me/'),
        ]);

        setWallets(walletRes.data);
        setMainTransactions(mainTxRes.data.transactions || []);
        setReferralTransactions(refTxRes.data.transactions || []);

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

  const currentTransactions = activeTab === 'main' ? mainTransactions : referralTransactions;

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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Wallet</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        </div>

        {/* Wallet Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Main Wallet</h2>
                <p className="text-3xl font-bold text-primary-500 mt-1">
                  KES {wallets?.main_wallet_balance.toFixed(2) || '0.00'}
                </p>
              </div>
              <button
                onClick={() => handleWithdraw('main')}
                className="btn-primary text-sm px-3 py-1.5"
              >
                Withdraw
              </button>
            </div>
          </div>
          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Referral Wallet</h2>
                <p className="text-3xl font-bold text-success-500 mt-1">
                  KES {wallets?.referral_wallet_balance.toFixed(2) || '0.00'}
                </p>
              </div>
              <button
                onClick={() => handleWithdraw('referral')}
                className="btn-primary text-sm px-3 py-1.5"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="card mb-6">
          <div className="flex border-b border-gray-200 mb-4">
            <button
              className={`pb-2 px-4 font-medium ${
                activeTab === 'main'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('main')}
            >
              Main Wallet Transactions
            </button>
            <button
              className={`pb-2 px-4 font-medium ${
                activeTab === 'referral'
                  ? 'text-success-500 border-b-2 border-success-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('referral')}
            >
              Referral Wallet Transactions
            </button>
          </div>

          {currentTransactions.length > 0 ? (
            <div className="space-y-3">
              {currentTransactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium">{formatTransactionType(tx.transaction_type)}</p>
                    <p className="text-sm text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <p className={`font-semibold ${
                    tx.amount >= 0 ? 'text-success-500' : 'text-red-500'
                  }`}>
                    {tx.amount >= 0 ? '+' : ''}KES {Math.abs(tx.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No transactions yet.
            </div>
          )}
        </div>

        {/* Payment Details Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Payment Details</h2>
            <button
              onClick={handleEditClick}
              className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-lg hover:bg-amber-200 transition"
            >
              Edit
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payout Method
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payout_method"
                      checked={editForm.payout_method === 'mobile'}
                      onChange={() => setEditForm({...editForm, payout_method: 'mobile'})}
                      className="mr-2"
                    />
                    <span>Mobile Money</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payout_method"
                      checked={editForm.payout_method === 'bank'}
                      onChange={() => setEditForm({...editForm, payout_method: 'bank'})}
                      className="mr-2"
                    />
                    <span>Bank Transfer</span>
                  </label>
                </div>
              </div>

              {editForm.payout_method === 'mobile' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number (M-Pesa)
                  </label>
                  <input
                    type="tel"
                    value={editForm.payout_phone}
                    onChange={(e) => setEditForm({...editForm, payout_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="2547XXXXXXXX"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={editForm.payout_bank_name}
                      onChange={(e) => setEditForm({...editForm, payout_bank_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Branch
                    </label>
                    <input
                      type="text"
                      value={editForm.payout_bank_branch}
                      onChange={(e) => setEditForm({...editForm, payout_bank_branch: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={editForm.payout_account_number}
                      onChange={(e) => setEditForm({...editForm, payout_account_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-outline px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary px-4 py-2 flex items-center"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            paymentDetails ? (
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Method:</span>
                  <span className="ml-2 text-gray-800">
                    {paymentDetails.payout_method === 'mobile' ? 'Mobile Money' : 'Bank Transfer'}
                  </span>
                </div>

                {paymentDetails.payout_method === 'mobile' ? (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Phone Number:</span>
                    <span className="ml-2 text-gray-800">{paymentDetails.payout_phone || 'Not set'}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Bank:</span>
                      <span className="ml-2 text-gray-800">{paymentDetails.payout_bank_name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Branch:</span>
                      <span className="ml-2 text-gray-800">{paymentDetails.payout_bank_branch || '—'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Account:</span>
                      <span className="ml-2 text-gray-800">{paymentDetails.payout_account_number || '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 italic">Payment details not available</div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;