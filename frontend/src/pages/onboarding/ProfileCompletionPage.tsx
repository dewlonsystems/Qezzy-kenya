// src/pages/onboarding/ProfileCompletionPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';

// Validation helpers
const isValidName = (value: string): boolean => {
  return /^[a-zA-Z\s\-']+$/u.test(value) && value.trim().length > 0;
};

const isValidPhoneNumber = (value: string): boolean => {
  return /^0[17]\d{8}$/.test(value);
};

const isValidSkills = (value: string): boolean => {
  if (!value.trim()) return true; // optional
  // Only letters, spaces, and commas allowed
  return /^[a-zA-Z\s,]+$/u.test(value);
};

const isValidReferralCode = (value: string): boolean => {
  if (!value.trim()) return true; // optional
  return /^[a-zA-Z0-9]{1,8}$/.test(value);
};

const isValidStreet = (value: string): boolean => {
  return /^[a-zA-Z0-9\s\-.,#']+$/u.test(value) && value.trim().length > 0;
};

const isValidHouseNumber = (value: string): boolean => {
  return /^[a-zA-Z0-9\s\-\/]+$/u.test(value) && value.trim().length > 0;
};

const isValidZipCode = (value: string): boolean => {
  return /^\d{1,5}$/.test(value);
};

const isValidTown = (value: string): boolean => {
  return /^[a-zA-Z\s]+$/u.test(value) && value.trim().length > 0;
};

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user types
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

    if (!isValidName(formData.first_name)) {
      newErrors.first_name = 'First name must contain only letters, spaces, hyphens, or apostrophes.';
    }
    if (!isValidName(formData.last_name)) {
      newErrors.last_name = 'Last name must contain only letters, spaces, hyphens, or apostrophes.';
    }
    if (!isValidPhoneNumber(formData.phone_number)) {
      newErrors.phone_number = 'Phone must be 10 digits, starting with 07 or 01 (e.g., 0712345678).';
    }
    if (!isValidStreet(formData.street)) {
      newErrors.street = 'Street must contain only letters, numbers, spaces, or basic punctuation (.,#-).';
    }
    if (!isValidHouseNumber(formData.house_number)) {
      newErrors.house_number = 'House number can contain letters, numbers, spaces, hyphens, or slashes.';
    }
    if (!isValidZipCode(formData.zip_code)) {
      newErrors.zip_code = 'ZIP code must be 1–5 digits (numbers only).';
    }
    if (!isValidTown(formData.town)) {
      newErrors.town = 'Town must contain only letters and spaces.';
    }
    if (!isValidSkills(formData.skills)) {
      newErrors.skills = 'Skills must contain only letters, spaces, and commas.';
    }
    if (!isValidReferralCode(formData.referral_code)) {
      newErrors.referral_code = 'Referral code must be 1–8 alphanumeric characters.';
    }

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
      const skills = formData.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600 mb-6">Help us get to know you better.</p>

          {(generalError || Object.keys(errors).length > 0) && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {generalError || 'Please correct the highlighted fields.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300 focus:ring-primary-500'
                  }`}
                  required
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300 focus:ring-primary-500'
                  }`}
                  required
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                  errors.phone_number ? 'border-red-500' : 'border-gray-300 focus:ring-primary-500'
                }`}
                required
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street/Road *</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                      errors.street ? 'border-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    required
                  />
                  {errors.street && (
                    <p className="mt-1 text-sm text-red-600">{errors.street}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">House Number *</label>
                  <input
                    type="text"
                    name="house_number"
                    value={formData.house_number}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                      errors.house_number ? 'border-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    required
                  />
                  {errors.house_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.house_number}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                      errors.zip_code ? 'border-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    required
                  />
                  {errors.zip_code && (
                    <p className="mt-1 text-sm text-red-600">{errors.zip_code}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Town *</label>
                  <input
                    type="text"
                    name="town"
                    value={formData.town}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                      errors.town ? 'border-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    required
                  />
                  {errors.town && (
                    <p className="mt-1 text-sm text-red-600">{errors.town}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills (comma-separated, e.g., "Writing, Design, Coding")
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                  errors.skills ? 'border-red-500' : 'border-gray-300 focus:ring-primary-500'
                }`}
                placeholder="e.g., Marketing, Video Editing"
              />
              {errors.skills && (
                <p className="mt-1 text-sm text-red-600">{errors.skills}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referral Code (optional)
              </label>
              <input
                type="text"
                name="referral_code"
                value={formData.referral_code}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                  errors.referral_code ? 'border-red-500' : 'border-gray-300 focus:ring-primary-500'
                }`}
                placeholder="Enter code if you have one"
              />
              {errors.referral_code && (
                <p className="mt-1 text-sm text-red-600">{errors.referral_code}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full ${loading ? 'opacity-75' : ''}`}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionPage;