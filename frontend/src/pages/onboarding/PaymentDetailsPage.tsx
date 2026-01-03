// src/pages/onboarding/PaymentDetailsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

// Google Fonts: Inter
const InterFontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
);

// Lucide-style SVG Icons
const CreditCardIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const SmartphoneIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12" y2="18" />
  </svg>
);

const BuildingIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <path d="M2 12h20" />
    <path d="M6 5v14" />
    <path d="M10 5v14" />
    <path d="M14 5v14" />
    <path d="M18 5v14" />
  </svg>
);

const CheckCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const SparklesIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const ArrowRightIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ArrowLeftIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ShieldIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// Kenyan banks
const KENYAN_BANKS = [
  '--- Select Bank ---',
  'Absa Bank Kenya',
  'ABC Bank Kenya',
  'Bank of Africa Kenya',
  'Bank of Baroda Kenya',
  'Bank of India Kenya',
  'CBA Kenya (Commercial Bank of Africa)',
  'Chase Bank Kenya',
  'Citib bank Kenya',
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
  const [bankName, setBankName] = useState('--- Select Bank ---');
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

  const isMobileValid = mobilePhone && /^0[17]\d{8}$/.test(mobilePhone);
  const isBankValid = bankName !== '--- Select Bank ---' && bankBranch.trim() && /^\d+$/.test(accountNumber.trim());
  const isFormValid = payoutMethod === 'mobile' ? isMobileValid : isBankValid;

  return (
    <>
      <InterFontLink />
      <div className="min-h-screen bg-gray-50 p-4 font-sans">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 mx-auto flex items-center justify-center mb-4 shadow-lg">
              <CreditCardIcon className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Payment Details</h1>
            <p className="text-gray-600">
              Set up how you'd like to receive your earnings
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
            {(generalError || Object.keys(errors).length > 0) && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {generalError || 'Please correct the highlighted fields.'}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <label className="text-base font-medium text-gray-800 block">Choose Payout Method</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mobile Money */}
                  <div
                    onClick={() => setPayoutMethod('mobile')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      payoutMethod === 'mobile'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${
                      payoutMethod === 'mobile' ? 'bg-amber-500 text-white' : 'bg-gray-100'
                    }`}>
                      <SmartphoneIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Mobile Money</p>
                      <p className="text-xs text-gray-600">M-Pesa, Airtel Money</p>
                    </div>
                    {payoutMethod === 'mobile' && (
                      <CheckCircleIcon className="w-5 h-5 text-amber-500 ml-auto" />
                    )}
                  </div>

                  {/* Bank Transfer */}
                  <div
                    onClick={() => setPayoutMethod('bank')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      payoutMethod === 'bank'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${
                      payoutMethod === 'bank' ? 'bg-amber-500 text-white' : 'bg-gray-100'
                    }`}>
                      <BuildingIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Bank Transfer</p>
                      <p className="text-xs text-gray-600">Local bank account</p>
                    </div>
                    {payoutMethod === 'bank' && (
                      <CheckCircleIcon className="w-5 h-5 text-amber-500 ml-auto" />
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Money Fields */}
              {payoutMethod === 'mobile' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-1">
                      <SmartphoneIcon className="w-4 h-4" />
                      M-Pesa Recommended
                    </div>
                    <p className="text-xs text-green-600">
                      Instant withdrawals with no extra fees
                    </p>
                  </div>

                  <div>
                    <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <SmartphoneIcon className="w-4 h-4 text-gray-500" />
                      M-Pesa Phone Number *
                    </label>
                    <div className="flex">
                      <div className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm font-medium">
                        +254
                      </div>
                      <input
                        id="mobilePhone"
                        type="tel"
                        placeholder="712 345 678"
                        value={mobilePhone}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) {
                            setMobilePhone(value);
                            clearError('mobilePhone');
                          }
                        }}
                        className={`flex-1 px-4 py-3 border rounded-r-xl focus:ring-2 focus:outline-none ${
                          errors.mobilePhone ? 'border-red-500 border-l-0' : 'border-gray-300 focus:ring-amber-500'
                        }`}
                        maxLength={9}
                      />
                    </div>
                    {errors.mobilePhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.mobilePhone}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Bank Transfer Fields */}
              {payoutMethod === 'bank' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
                      <BuildingIcon className="w-4 h-4" />
                      Bank Processing Time
                    </div>
                    <p className="text-xs text-amber-600">
                      Bank transfers may take 1-3 business days to process
                    </p>
                  </div>

                  <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                    <select
                      id="bankName"
                      value={bankName}
                      onChange={(e) => {
                        setBankName(e.target.value);
                        clearError('bankName');
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none ${
                        errors.bankName ? 'border-red-500' : 'border-gray-300 focus:ring-amber-500'
                      }`}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                      <input
                        id="accountNumber"
                        type="text"
                        placeholder="e.g., 1234567890"
                        value={accountNumber}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) {
                            setAccountNumber(value);
                            clearError('accountNumber');
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none ${
                          errors.accountNumber ? 'border-red-500' : 'border-gray-300 focus:ring-amber-500'
                        }`}
                      />
                      {errors.accountNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="bankBranch" className="block text-sm font-medium text-gray-700 mb-1">Branch Code *</label>
                      <input
                        id="bankBranch"
                        type="text"
                        placeholder="e.g., Westlands or 01001"
                        value={bankBranch}
                        onChange={(e) => {
                          setBankBranch(e.target.value);
                          clearError('bankBranch');
                        }}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none ${
                          errors.bankBranch ? 'border-red-500' : 'border-gray-300 focus:ring-amber-500'
                        }`}
                      />
                      {errors.bankBranch && (
                        <p className="mt-1 text-sm text-red-600">{errors.bankBranch}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/onboarding/profile')}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className={`flex-1 py-3 px-4 font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${
                    isFormValid && !loading
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <>
                      <SparklesIcon className="w-5 h-5 animate-pulse" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRightIcon className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              {/* Security Note */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <ShieldIcon className="w-4 h-4 text-green-600" />
                <span>Payment details are encrypted and never shared</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentDetailsPage;