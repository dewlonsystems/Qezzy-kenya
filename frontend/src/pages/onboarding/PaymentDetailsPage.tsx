// src/pages/onboarding/PaymentDetailsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

const PaymentDetailsPage = () => {
  const navigate = useNavigate();
  
  const [payoutMethod, setPayoutMethod] = useState<'mobile' | 'bank'>('mobile');
  const [mobilePhone, setMobilePhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let payload: any = { payout_method: payoutMethod };

      if (payoutMethod === 'mobile') {
        if (!mobilePhone) throw new Error('Phone number is required');
        payload.phone_number = mobilePhone;
      } else {
        if (!bankName || !bankBranch || !accountNumber) {
          throw new Error('All bank details are required');
        }
        payload = {
          ...payload,
          bank_name: bankName,
          bank_branch: bankBranch,
          account_number: accountNumber,
        };
      }

      await api.post('/onboarding/payment/', payload);
      navigate('/activation');
    } catch (err: any) {
      console.error('Payment details error:', err);
      setError(err.message || 'Failed to save payment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Details</h1>
          <p className="text-gray-600 mb-6">How would you like to receive your earnings?</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setPayoutMethod('mobile')}
                className={`flex-1 py-3 rounded-lg border ${
                  payoutMethod === 'mobile'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                Mobile Transfer
              </button>
              <button
                type="button"
                onClick={() => setPayoutMethod('bank')}
                className={`flex-1 py-3 rounded-lg border ${
                  payoutMethod === 'bank'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                Bank Transfer
              </button>
            </div>

            {payoutMethod === 'mobile' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="e.g., 0712345678"
                  required
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch/Code *</label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full ${loading ? 'opacity-75' : ''}`}
            >
              {loading ? 'Saving...' : 'Complete Onboarding'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsPage;