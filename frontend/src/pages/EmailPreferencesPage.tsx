// src/pages/EmailPreferencesPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

// ====== SVG Icons ======
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const GiftIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

type PreferenceState = {
  task_notifications: boolean;
  promotional: boolean;
  statement: boolean;
};

const EmailPreferencesPage = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // ✅ REPLACED union type with separate boolean flags to fix TypeScript narrowing
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const [message, setMessage] = useState<string>('');
  const [preferences, setPreferences] = useState<PreferenceState | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Auto-unsubscribe types from URL param
  const autoUnsubscribe = searchParams.get('auto_unsubscribe');

  useEffect(() => {
    if (!token) {
      setHasError(true);
      setMessage('Invalid or missing preference token.');
      setIsLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        // First, try to fetch current preferences
        const response = await api.get(`/users/email-preferences/${token}/`);
        
        setUserEmail(response.data.email);
        setPreferences({
          task_notifications: response.data.receive_task_notifications,
          promotional: response.data.receive_promotional_emails,
          statement: response.data.receive_statement_emails,
        });
        
        // If auto-unsubscribe param exists, process it
        if (autoUnsubscribe) {
          await handleAutoUnsubscribe(autoUnsubscribe);
        } else {
          setMessage('Your email preferences are shown below. Toggle to update.');
        }
      } catch (err: any) {
        console.error('Failed to load preferences:', err);
        setHasError(true);
        setMessage(err.response?.data?.error || 'Could not load your preferences. The link may be expired or invalid.');
      } finally {
        // ✅ Always stop loading when done
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [token, autoUnsubscribe]);

  const handleAutoUnsubscribe = async (type: string) => {
    setIsUpdating(true);
    try {
      const endpointMap: Record<string, string> = {
        'task_notifications': '/users/email-preferences/unsubscribe/task/',
        'promotional': '/users/email-preferences/unsubscribe/promotional/',
        'statement': '/users/email-preferences/unsubscribe/statement/',
        'all': '/users/email-preferences/unsubscribe/all/',
      };
      
      const endpoint = endpointMap[type];
      if (!endpoint) throw new Error('Invalid unsubscribe type');

      await api.post(endpoint, { token });
      
      // Update local state to reflect change
      if (type === 'all') {
        setPreferences({ task_notifications: false, promotional: false, statement: false });
        setMessage("✅ You've been unsubscribed from all marketing emails.");
      } else {
        setPreferences(prev => prev ? { ...prev, [type]: false } : null);
        const labels: Record<string, string> = {
          task_notifications: 'task assignment emails',
          promotional: 'promotional emails',
          statement: 'statement emails',
        };
        setMessage(`✅ You've been unsubscribed from ${labels[type]}.`);
      }
    } catch (err: any) {
      console.error('Auto-unsubscribe failed:', err);
      setHasError(true);
      setMessage(err.response?.data?.error || 'Failed to update preferences. Please try again.');
    } finally {
      // ✅ Always stop updating when done
      setIsUpdating(false);
    }
  };

  const handleTogglePreference = async (key: keyof PreferenceState) => {
    if (!preferences || !token) return;
    
    setIsUpdating(true);
    setError('');
    
    try {
      const newValue = !preferences[key];
      
      // Optimistic update
      setPreferences({ ...preferences, [key]: newValue });
      
      // API call
      await api.patch(`/users/email-preferences/${token}/`, {
        [key]: newValue,
      });
      
      setMessage('✅ Preferences updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to update preference:', err);
      // Revert optimistic update
      setPreferences({ ...preferences, [key]: !preferences[key] });
      setError(err.response?.data?.error || 'Failed to save changes. Please try again.');
    } finally {
      // ✅ Always stop updating when done
      setIsUpdating(false);
    }
  };

  const handleSaveAll = async () => {
    if (!preferences || !token) return;
    
    setIsUpdating(true);
    setError('');
    
    try {
      await api.patch(`/users/email-preferences/${token}/`, {
        receive_task_notifications: preferences.task_notifications,
        receive_promotional_emails: preferences.promotional,
        receive_statement_emails: preferences.statement,
      });
      
      setMessage('✅ All preferences saved successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      setError(err.response?.data?.error || 'Failed to save changes. Please try again.');
    } finally {
      // ✅ Always stop updating when done
      setIsUpdating(false);
    }
  };

  // ====== Loading/Updating State ======
  if (isLoading || isUpdating) {
    return (
      <div className="min-h-screen bg-landing-cream flex items-center justify-center p-4">
        <LoadingSpinner message={isUpdating ? 'Updating preferences...' : 'Loading your preferences...'} />
      </div>
    );
  }

  // ====== Error State ======
  if (hasError) {
    return (
      <div className="min-h-screen bg-landing-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-amber-100 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <XCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-landing-heading mb-2">Something Went Wrong</h1>
          <p className="text-landing-muted mb-6">{message}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:shadow-lg transition-all"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ====== Success State (Preferences Form) ======
  return (
    <div className="min-h-screen bg-landing-cream font-inter p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pt-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-landing-text hover:text-amber-600 flex items-center transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-landing-heading">Email Preferences</h1>
        </div>

        {/* Status Message */}
        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-800 text-sm">{message}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
            <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Account Info Card */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-amber-100 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
              {userEmail?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-landing-heading">{userEmail || 'Loading...'}</p>
              <p className="text-sm text-landing-muted">Manage what emails you receive</p>
            </div>
          </div>
        </div>

        {/* Preferences Form */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-amber-100">
          <h2 className="text-lg font-bold text-landing-heading mb-4">Email Notifications</h2>
          
          <div className="space-y-4">
            {/* Task Notifications */}
            <label className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100/50 transition-colors">
              <input
                type="checkbox"
                checked={preferences?.task_notifications ?? false}
                onChange={() => handleTogglePreference('task_notifications')}
                disabled={isUpdating}  // ✅ Simple boolean - no TypeScript errors!
                className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <BellIcon className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-landing-heading">Task Assignments</span>
                </div>
                <p className="text-sm text-landing-muted">
                  Get notified when new survey tasks are available for you to earn money.
                </p>
              </div>
            </label>

            {/* Promotional Emails */}
            <label className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100/50 transition-colors">
              <input
                type="checkbox"
                checked={preferences?.promotional ?? false}
                onChange={() => handleTogglePreference('promotional')}
                disabled={isUpdating}  // ✅ Simple boolean
                className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <GiftIcon className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-landing-heading">Promotional Updates</span>
                </div>
                <p className="text-sm text-landing-muted">
                  Receive news about new features, bonus opportunities, and platform updates.
                </p>
              </div>
            </label>

            {/* Statement Emails */}
            <label className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100/50 transition-colors">
              <input
                type="checkbox"
                checked={preferences?.statement ?? false}
                onChange={() => handleTogglePreference('statement')}
                disabled={isUpdating}  // ✅ Simple boolean
                className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileTextIcon className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-landing-heading">Account Statements</span>
                </div>
                <p className="text-sm text-landing-muted">
                  Get monthly statements and important account security notifications.
                </p>
              </div>
            </label>
          </div>

          {/* Save Button */}
          <div className="mt-6 pt-6 border-t border-amber-100">
            <button
              onClick={handleSaveAll}
              disabled={isUpdating}  // ✅ Simple boolean - no TypeScript errors!
              className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isUpdating ? (  // ✅ Simple boolean comparison
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <MailIcon className="w-5 h-5" />
                  Save All Preferences
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-landing-muted mt-8">
          You can change these settings anytime. Transactional emails about your account 
          (like withdrawals) will always be sent for security.
        </p>
      </div>
    </div>
  );
};

export default EmailPreferencesPage;