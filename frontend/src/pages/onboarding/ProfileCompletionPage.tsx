// src/pages/onboarding/ProfileCompletionPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';

const ProfileCompletionPage = () => {
  const { refreshUser } = useAuth(); // ← Use refreshUser instead of currentUser
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
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const skills = formData.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        street: formData.street,
        house_number: formData.house_number,
        zip_code: formData.zip_code,
        town: formData.town,
        skills: skills,
        referral_code: formData.referral_code || undefined,
      };

      // Save profile to backend
      await api.post('/onboarding/profile/', payload);

      // 🔑 CRITICAL: Refresh user data in AuthContext
      await refreshUser();

      // Now currentUser has first_name/last_name → no more "User" fallback!
      navigate('/onboarding/payment');
    } catch (err: any) {
      console.error('Profile submission error:', err);
      setError(err.response?.data?.error || 'Failed to save profile. Please try again.');
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

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                required
              />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">House Number *</label>
                  <input
                    type="text"
                    name="house_number"
                    value={formData.house_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    required
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Town *</label>
                  <input
                    type="text"
                    name="town"
                    value={formData.town}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    required
                  />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="e.g., Marketing, Video Editing"
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="Enter code if you have one"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full ${loading ? 'opacity-75' : ''}`}
            >
              {loading ? 'Saving...' : 'Continue to Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionPage;