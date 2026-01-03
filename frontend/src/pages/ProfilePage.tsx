// src/pages/ProfilePage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import type { User } from '../types';

const ProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: '',
    street: '',
    house_number: '',
    zip_code: '',
    town: '',
    skills: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        phone_number: currentUser.phone_number,
        street: currentUser.address.street,
        house_number: currentUser.address.house_number,
        zip_code: currentUser.address.zip_code,
        town: currentUser.address.town,
        skills: currentUser.skills.join(', '),
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const skills = formData.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const payload = {
        phone_number: formData.phone_number,
        address: {
          street: formData.street,
          house_number: formData.house_number,
          zip_code: formData.zip_code,
          town: formData.town,
        },
        skills: skills,
      };

      await api.patch('/users/profile/', payload);
      alert('Profile updated successfully!');
      setIsEditing(false);
      // Refresh user data
      const res = await api.get('/users/me/');
      setUser(res.data);
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (currentUser) {
      setFormData({
        phone_number: currentUser.phone_number,
        street: currentUser.address.street,
        house_number: currentUser.address.house_number,
        zip_code: currentUser.address.zip_code,
        town: currentUser.address.town,
        skills: currentUser.skills.join(', '),
      });
    }
  };

  const handleCloseAccount = () => {
    if (window.confirm('Are you sure you want to close your account? This action cannot be undone.')) {
      api.post('/users/close/')
        .then(() => {
          alert('Account closed successfully.');
          logout();
        })
        .catch(err => {
          alert('Failed to close account. Please contact support.');
          console.error(err);
        });
    }
  };

  if (!user) {
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
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <button
            onClick={() => window.history.back()}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        </div>

        <div className="card">
          <div className="text-center mb-6 pb-4 border-b border-gray-100">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-primary-600">
                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="mt-1 inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              Referral Code: {user.referral_code}
            </p>
          </div>

          <div className="space-y-5">
            {/* Immutable Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p className="text-gray-800">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-gray-500 mt-1">Immutable</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-800">{user.email}</p>
              <p className="text-xs text-gray-500 mt-1">Immutable</p>
            </div>

            {/* Editable Fields */}
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({...formData, street: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">House Number</label>
                    <input
                      type="text"
                      value={formData.house_number}
                      onChange={(e) => setFormData({...formData, house_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
                  <input
                    type="text"
                    value={formData.town}
                    onChange={(e) => setFormData({...formData, town: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {error && (
                  <div className="p-2 bg-red-50 text-red-700 text-sm rounded">{error}</div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <p className="text-gray-800">{user.phone_number || '—'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-800">
                    {user.address.street} {user.address.house_number},<br />
                    {user.address.zip_code} {user.address.town}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                  <p className="text-gray-800">
                    {user.skills.length > 0 ? user.skills.join(', ') : '—'}
                  </p>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-outline w-full mt-4"
                >
                  Edit Profile
                </button>
              </>
            )}

            {/* Close Account */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="font-medium text-gray-800 mb-2">Close Account</h3>
              <p className="text-sm text-gray-600 mb-3">
                Permanently close your account. All data will be retained but access will be disabled.
              </p>
              <button
                onClick={handleCloseAccount}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Close Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;