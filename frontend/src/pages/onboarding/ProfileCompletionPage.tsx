// src/pages/onboarding/ProfileCompletionPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';

// Google Fonts: Inter
const InterFontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
);

// Lucide-style SVG Icons
const UserIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const PhoneIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MapPinIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M20 10c0-4.42-3.58-8-8-8s-8 3.58-8 8 3.58 8 8 8 8-3.58 8-8" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const GiftIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
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

const CheckCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// Validation helpers (your exact logic)
const isValidName = (value: string): boolean => /^[a-zA-Z\s\-']+$/u.test(value) && value.trim().length > 0;
const isValidPhoneNumber = (value: string): boolean => /^0[17]\d{8}$/.test(value);
const isValidSkills = (value: string): boolean => !value.trim() || /^[a-zA-Z\s,]+$/u.test(value);
const isValidReferralCode = (value: string): boolean => !value.trim() || /^[a-zA-Z0-9]{1,8}$/.test(value);
const isValidStreet = (value: string): boolean => /^[a-zA-Z0-9\s\-.,#']+$/u.test(value) && value.trim().length > 0;
const isValidHouseNumber = (value: string): boolean => /^[a-zA-Z0-9\s\-\/]+$/u.test(value) && value.trim().length > 0;
const isValidZipCode = (value: string): boolean => /^\d{1,5}$/.test(value);
const isValidTown = (value: string): boolean => /^[a-zA-Z\s]+$/u.test(value) && value.trim().length > 0;

const ProfileCompletionPage = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    street: '',
    house_number: '',
    zip_code: '',
    town: '',
    skills: '',
    referral_code: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isValidName(formData.first_name)) newErrors.first_name = 'First name must contain only letters, spaces, hyphens, or apostrophes.';
    if (!isValidName(formData.last_name)) newErrors.last_name = 'Last name must contain only letters, spaces, hyphens, or apostrophes.';
    if (!isValidPhoneNumber(formData.phone_number)) newErrors.phone_number = 'Phone must be 10 digits, starting with 07 or 01 (e.g., 0712345678).';
    if (!isValidStreet(formData.street)) newErrors.street = 'Street must contain only letters, numbers, spaces, or basic punctuation (.,#-).';
    if (!isValidHouseNumber(formData.house_number)) newErrors.house_number = 'House number can contain letters, numbers, spaces, hyphens, or slashes.';
    if (!isValidZipCode(formData.zip_code)) newErrors.zip_code = 'ZIP code must be 1–5 digits (numbers only).';
    if (!isValidTown(formData.town)) newErrors.town = 'Town must contain only letters and spaces.';
    if (!isValidSkills(formData.skills)) newErrors.skills = 'Skills must contain only letters, spaces, and commas.';
    if (!isValidReferralCode(formData.referral_code)) newErrors.referral_code = 'Referral code must be 1–8 alphanumeric characters.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      const skills = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone_number: formData.phone_number,
        street: formData.street.trim(),
        house_number: formData.house_number.trim(),
        zip_code: formData.zip_code,
        town: formData.town.trim(),
        skills: skills,
        referral_code: formData.referral_code.trim() || undefined,
      };

      await api.post('/onboarding/profile/', payload);
      await refreshUser();
      navigate('/onboarding/payment');
    } catch (err: any) {
      console.error('Profile submission error:', err);
      setGeneralError(err.response?.data?.error || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Determine if form is valid for button state
  const isFormValid = () => {
    return (
      isValidName(formData.first_name) &&
      isValidName(formData.last_name) &&
      isValidPhoneNumber(formData.phone_number) &&
      isValidStreet(formData.street) &&
      isValidHouseNumber(formData.house_number) &&
      isValidZipCode(formData.zip_code) &&
      isValidTown(formData.town)
    );
  };

  return (
    <>
      <InterFontLink />
      <div className="min-h-screen bg-gray-50 p-4 font-sans">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 mx-auto flex items-center justify-center mb-4 shadow-lg">
              <UserIcon className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Complete Your Profile</h1>
            <p className="text-gray-600">
              Tell us about yourself to personalize your experience
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
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    First Name *
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none ${
                      errors.first_name ? 'border-red-500' : 'border-gray-300 focus:ring-amber-500'
                    }`}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none ${
                      errors.last_name ? 'border-red-500' : 'border-gray-300 focus:ring-amber-500'
                    }`}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-gray-500" />
                  Phone Number *
                </label>
                <div className="flex">
                  <div className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm font-medium">
                    +254
                  </div>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    placeholder="712 345 678"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className={`flex-1 px-4 py-3 border rounded-r-xl focus:ring-2 focus:outline-none ${
                      errors.phone_number ? 'border-red-500 border-l-0' : 'border-gray-300 focus:ring-amber-500'
                    }`}
                  />
                </div>
                {errors.phone_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 text-gray-500" />
                      Street/Road *
                    </label>
                    <input
                      id="street"
                      name="street"
                      type="text"
                      placeholder="Kenyatta Avenue"
                      value={formData.street}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none ${
                        errors.street ? 'border-red-500' : 'border-gray-300 focus:ring-amber-500'
                      }`}
                    />
                    {errors.street && (
                      <p className="mt-1 text-sm text-red-600">{errors.street}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="house_number" className="block text-sm font-medium text-gray-700 mb-1">House Number *</label>
                    <input
                      id="house_number"
                      name="house_number"
                      type="text"
                      placeholder="123"
                      value={formData.house_number}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none ${
                        errors.house_number ? 'border-red-500' : 'border-gray-300 focus:ring-amber-500'
                      }`}
                    />
                    {errors.house_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.house_number}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                    <input
                      id="zip_code"
                      name="zip_code"
                      type="text"
                      placeholder="00100"
                      value={formData.zip_code}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none ${
                        errors.zip_code ? 'border-red-500' : 'border-gray-300 focus:ring-amber-500'
                      }`}
                    />
                    {errors.zip_code && (
                      <p className="mt-1 text-sm text-red-600">{errors.zip_code}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-1">Town *</label>
                    <input
                      id="town"
                      name="town"
                      type="text"
                      placeholder="Nairobi"
                      value={formData.town}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none ${
                        errors.town ? 'border-red-500' : 'border-gray-300 focus:ring-amber-500'
                      }`}
                    />
                    {errors.town && (
                      <p className="mt-1 text-sm text-red-600">{errors.town}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma-separated, e.g., "Writing, Data Entry")
                </label>
                <input
                  id="skills"
                  name="skills"
                  type="text"
                  placeholder="e.g., Marketing, Video Editing"
                  value={formData.skills}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none ${
                    errors.skills ? 'border-red-500' : 'border-gray-300 focus:ring-amber-500'
                  }`}
                />
                {errors.skills && (
                  <p className="mt-1 text-sm text-red-600">{errors.skills}</p>
                )}
              </div>

              {/* Referral Code */}
              <div className="relative">
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                  <label htmlFor="referral_code" className="block text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <GiftIcon className="w-4 h-4 text-amber-600" />
                    Referral Code (Optional)
                  </label>
                  <p className="text-xs text-amber-700 mb-3">
                    Enter a referral code from a friend to connect your accounts
                  </p>
                  <input
                    id="referral_code"
                    name="referral_code"
                    type="text"
                    placeholder="e.g., ABC12345"
                    value={formData.referral_code}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:outline-none focus:ring-amber-500 ${
                      errors.referral_code ? 'border-red-500' : ''
                    }`}
                    maxLength={8}
                  />
                  {errors.referral_code && (
                    <p className="mt-1 text-sm text-red-600">{errors.referral_code}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid() || loading}
                className={`w-full py-3 px-4 font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${
                  isFormValid() && !loading
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
                    continue
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Security Note */}
              <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                <CheckCircleIcon className="w-3 h-3 text-green-600" />
                Your information is encrypted and secure
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileCompletionPage;