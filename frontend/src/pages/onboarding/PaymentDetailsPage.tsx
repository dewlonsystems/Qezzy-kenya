// src/pages/onboarding/PaymentDetailsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

// Comprehensive list of Kenyan banks (as of 2026)
const KENYAN_BANKS = [
  '--- Select Bank ---',
  'Absa Bank Kenya',
  'ABC Bank Kenya',
  'Bank of Africa Kenya',
  'Bank of Baroda Kenya',
  'Bank of India Kenya',
  'CBA Kenya (Commercial Bank of Africa)',
  'Chase Bank Kenya',
  'Citibank Kenya',
  'Co-operative Bank of Kenya',
  'Diamond Trust Bank (DTB) Kenya',
  'Dubai Islamic Bank Kenya',
  'Equity Bank Kenya',
  'Family Bank',
  'Faulu Microfinance Bank',
  'First Community Bank',
  'Gulf African Bank',
  'Guaranty Trust Bank Kenya',
  'Housing Finance Company of Kenya',
  'I&M Bank Kenya',
  'KCB Bank Kenya',
  'Kenya Women Microfinance Bank (KWFT)',
  'M Oriental Bank',
  'Mayfair Bank',
  'Mwalimu Sacco Co-operative Bank',
  'National Bank of Kenya',
  'NCBA Bank Kenya',
  'Paramount Bank Kenya',
  'Premier Bank Kenya',
  'Prime Bank Kenya',
  'SBM Bank Kenya',
  'Sidian Bank',
  'Stanbic Bank Kenya',
  'Standard Chartered Bank Kenya',
  'Spire Bank',
  'Victoria Commercial Bank',
  'Zenith Bank Kenya',
  'Credit Bank',
  'Consolidated Bank of Kenya',
  'Guardian Bank',
  'Middle East Bank Kenya',
];

const PaymentDetailsPage = () => {
  const navigate = useNavigate();
  
  const [payoutMethod, setPayoutMethod] = useState<'mobile' | 'bank'>('mobile');
  const [mobilePhone, setMobilePhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (payoutMethod === 'mobile') {
      if (!mobilePhone) {
        newErrors.mobilePhone = 'Phone number is required';
      } else if (!/^0[17]\d{8}$/.test(mobilePhone)) {
        newErrors.mobilePhone = 'Phone must be 10 digits, starting with 07 or 01 (e.g., 0712345678)';
      }
    } else {
      if (!bankName || bankName === '--- Select Bank ---') {
        newErrors.bankName = 'Please select a bank';
      }
      if (!bankBranch.trim()) {
        newErrors.bankBranch = 'Branch/Code is required';
      } else if (!/^[a-zA-Z0-9\s\-\/.&]+$/u.test(bankBranch.trim())) {
        newErrors.bankBranch = 'Branch/Code can contain letters, numbers, spaces, and - / . &';
      }
      if (!accountNumber.trim()) {
        newErrors.accountNumber = 'Account number is required';
      } else if (!/^\d+$/.test(accountNumber.trim())) {
        newErrors.accountNumber = 'Account number must contain only numbers';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validate()) {
      setGeneralError('Please fix the errors below.');
      return;
    }

    setLoading(true);

    try {
      let payload: any = { payout_method: payoutMethod };

      if (payoutMethod === 'mobile') {
        payload.phone_number = mobilePhone;
      } else {
        payload = {
          ...payload,
          bank_name: bankName,
          bank_branch: bankBranch.trim(),
          account_number: accountNumber.trim(),
        };
      }

      await api.post('/onboarding/payment/', payload);
      navigate('/activation');
    } catch (err: any) {
      console.error('Payment details error:', err);
      setGeneralError(err.response?.data?.error || 'Failed to save payment details. Please try again.');
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

          {(generalError || Object.keys(errors).length > 0) && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {generalError || 'Please correct the highlighted fields.'}
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
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only digits
                    if (/^\d*$/.test(value)) {
                      setMobilePhone(value);
                      clearError('mobilePhone');
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                    errors.mobilePhone ? 'border-red-500' : 'border-gray-300 focus:ring-primary-500'
                  }`}
                  placeholder="e.g., 0712345678"
                  maxLength={10}
                />
                {errors.mobilePhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobilePhone}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                  <select
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                      clearError('bankName');
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                      errors.bankName ? 'border-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    required
                  >
                    {KENYAN_BANKS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                  {errors.bankName && (
                    <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch/Code *</label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => {
                      setBankBranch(e.target.value);
                      clearError('bankBranch');
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                      errors.bankBranch ? 'border-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="e.g., Westlands Branch or 01001"
                  />
                  {errors.bankBranch && (
                    <p className="mt-1 text-sm text-red-600">{errors.bankBranch}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only digits
                      if (/^\d*$/.test(value)) {
                        setAccountNumber(value);
                        clearError('accountNumber');
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                      errors.accountNumber ? 'border-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="e.g., 1234567890"
                  />
                  {errors.accountNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                  )}
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