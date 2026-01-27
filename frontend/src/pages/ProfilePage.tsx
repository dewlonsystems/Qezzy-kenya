// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext'; 
import api from '../api/client';
import type { User } from '../types';

// Google Fonts: Inter
const InterFontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
);

// Lucide-style SVG Icons (properly typed)
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

const EditIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

const CheckIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TrashIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const ShieldIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
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
        phone_number: currentUser.phone_number || '',
        street: currentUser.address?.street || '',
        house_number: currentUser.address?.house_number || '',
        zip_code: currentUser.address?.zip_code || '',
        town: currentUser.address?.town || '',
        skills: (currentUser.skills || []).join(', '),
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
      const res = await api.get('/users/me/');
      setUser(res.data);
      setIsEditing(false);

      showToast('Profile updated successfully!', 'success');

    } catch (err: any) {
      console.error('Update error:', err);
      const message = err.response?.data?.error || 'Failed to update profile. Please try again.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (currentUser) {
      setFormData({
        phone_number: currentUser.phone_number || '',
        street: currentUser.address?.street || '',
        house_number: currentUser.address?.house_number || '',
        zip_code: currentUser.address?.zip_code || '',
        town: currentUser.address?.town || '',
        skills: (currentUser.skills || []).join(', '),
      });
    }
  };

  const handleShareReferralLink = async () => {
    if (!user?.referral_code) return;

    const referralLink = `https://qezzykenya.company/?ref=${encodeURIComponent(user.referral_code)}`;

    // Try native share (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Qezzy Kenya',
          text: 'Earn KES 50 when you sign up with my link!',
          url: referralLink,
        });
        return;
      } catch (err) {
        // User canceled or not supported → fallback to copy
      }
    }

    // Fallback: copy full link to clipboard
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy referral link');
    }
  };

  const handleCloseAccount = async () => {
    try {
      await api.post('/users/close/');
      logout();
    } catch (err) {
      alert('Failed to close account. Please contact support.');
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();

  return (
    <>
      <InterFontLink />
      <div className="min-h-screen bg-gray-50 p-4 font-sans">
        <div className="max-w-md mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 text-xl font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-800 truncate">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
              </div>
            </div>

            {/* Referral Code */}
            <div className="mt-6 p-4 bg-amber-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                    Your Referral Code
                  </p>
                  <p className="text-lg font-bold font-mono mt-1">{user.referral_code}</p>
                </div>
                <button
                  onClick={handleShareReferralLink}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      {/* Share icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                      <span className="text-gray-600">Share Link</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Share this link with friends. Earn KES 50 for each successful referral!
              </p>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Account Information</h3>
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                  isEditing
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'text-gray-600 hover:text-amber-600 hover:bg-gray-100'
                }`}
              >
                {isEditing ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <EditIcon className="w-4 h-4" />
                    Edit
                  </>
                )}
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Immutable Fields */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="font-medium truncate">{user.first_name} {user.last_name}</p>
                  </div>
                  <ShieldIcon className="w-4 h-4 text-gray-300" />
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <MailIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Email Address</p>
                    <p className="font-medium truncate">{user.email}</p>
                  </div>
                  <ShieldIcon className="w-4 h-4 text-gray-300" />
                </div>
              </div>

              {/* Editable Fields */}
              {isEditing ? (
                <>
                  <div>
                    <label htmlFor="phone" className="text-xs text-gray-600 font-medium block mb-1">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="text"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 font-medium block mb-1">Street</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 font-medium block mb-1">House Number</label>
                      <input
                        type="text"
                        value={formData.house_number}
                        onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium block mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 font-medium block mb-1">Town</label>
                    <input
                      type="text"
                      value={formData.town}
                      onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="skills" className="text-xs text-gray-600 font-medium block mb-1">
                      Skills (comma separated)
                    </label>
                    <input
                      id="skills"
                      type="text"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                      placeholder="e.g., Data Entry, Transcription"
                    />
                  </div>

                  {error && <div className="text-red-600 text-sm p-2 bg-red-50 rounded">{error}</div>}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 py-2 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium rounded-lg shadow-sm transition-all"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2 px-4 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-gray-600 font-medium block mb-1">Phone Number</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <PhoneIcon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{user.phone_number || '—'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 font-medium block mb-1">Address</label>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPinIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span className="font-medium">
                        {user.address?.street || ''} {user.address?.house_number || ''},<br />
                        {user.address?.zip_code || ''} {user.address?.town || ''}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 font-medium block mb-1">Skills</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user.skills && user.skills.length > 0 ? (
                        user.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 🔒 Security Info — NEW SECTION */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Security Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">My IP address:</span>
                <span className="font-mono text-gray-800">{user.last_seen_ip || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">My device:</span>
                <span className="text-gray-800">{user.device_info || '—'}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              This information helps us keep your account secure.
            </p>
          </div>

          {/* Account Closure */}
          <div className="bg-white rounded-2xl border border-red-200 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrashIcon className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">Close Account</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Permanently deactivate your account and remove access to all features.
                </p>
                <button
                  onClick={() => setShowCloseDialog(true)}
                  className="mt-3 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                >
                  Request Account Closure
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-gray-800 mb-2">Close your account?</h3>
            <p className="text-gray-600 text-sm mb-6">
              This action will deactivate your account. Your financial records will be retained for compliance purposes.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseDialog(false)}
                className="flex-1 py-2 px-4 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseAccount}
                className="flex-1 py-2 px-4 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600"
              >
                Yes, close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePage;