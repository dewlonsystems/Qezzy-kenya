import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api/client';

// Lucide-style SVG Icons
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

const ShieldIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ClockIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// Types
interface Plan {
  id: number;
  name: string;
  tier_level: number;
  price_kes: string;
  duration_days: number;
  trial_days: number;
  description: string;
  features: string[];
  is_free: boolean;
}

interface SubscriptionStatus {
  has_active_subscription: boolean;
  current_tier: string | null;
  tier_level: number;
  end_date: string | null;
  grace_end_date: string | null;
  is_trial: boolean;
  auto_renew: boolean;
  plan?: {
    id: number;
    name: string;
    tier_level: number;
    price_kes: string;
    features: string[];
  };
}

const SubscriptionsPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activatingFreePlan, setActivatingFreePlan] = useState<number | null>(null);

  // Fetch plans and current subscription status
  useEffect(() => {
    const loadData = async () => {
      try {
        const [plansRes, statusRes] = await Promise.all([
          api.get('/api/subscriptions/plans/'),
          api.get('/api/subscriptions/status/'),
        ]);
        setPlans(plansRes.data.plans || []);
        setSubscriptionStatus(statusRes.data);
      } catch (err) {
        console.error('Failed to load subscription data:', err);
        setError('Failed to load plans. Please try again.');
        showToast('Unable to load subscription plans', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [showToast]);

  // Handle Free plan activation (no payment required)
  const handleActivateFreePlan = async (planId: number) => {
    setActivatingFreePlan(planId);
    try {
      await api.post('/api/subscriptions/subscribe/', {
        plan_id: planId,
        phone_number: currentUser?.phone_number || '',
        use_trial: false,
      });
      showToast('Free plan activated successfully!', 'success');
      // Refresh status and redirect
      const statusRes = await api.get('/api/subscriptions/status/');
      setSubscriptionStatus(statusRes.data);
      navigate('/overview');
    } catch (err: any) {
      console.error('Free plan activation error:', err);
      showToast(err.response?.data?.error || 'Failed to activate Free plan', 'error');
    } finally {
      setActivatingFreePlan(null);
    }
  };

  // Handle paid plan subscription → navigate to billing
  const handleSubscribe = (plan: Plan) => {
    if (!currentUser?.phone_number) {
      showToast('Please complete your profile with a phone number first', 'error');
      navigate('/onboarding/profile');
      return;
    }
    navigate('/billing', {
      state: {
        planId: plan.id,
        planName: plan.name,
        amount: parseFloat(plan.price_kes),
        duration: plan.duration_days,
        features: plan.features,
        isTrial: plan.trial_days > 0,
      },
    });
  };

  // Helper: Is this plan the user's current active subscription?
  const isCurrentPlan = (plan: Plan) =>
    subscriptionStatus?.has_active_subscription &&
    subscriptionStatus.plan?.id === plan.id;

  // Helper: Is this plan above user's current tier? (for UI hint)
  const isAboveCurrentTier = (plan: Plan) =>
    subscriptionStatus?.has_active_subscription &&
    plan.tier_level > (subscriptionStatus.tier_level || 0);

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 font-sans">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 pt-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 mx-auto flex items-center justify-center mb-4 animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
                <div className="h-10 bg-gray-200 rounded w-24 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-6" />
                <div className="space-y-2 mb-6">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded w-full" />
                  ))}
                </div>
                <div className="h-10 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
            <XIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="py-3 px-6 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 mx-auto flex items-center justify-center mb-4">
            <SparklesIcon className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Choose Your Plan</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Start with Free — upgrade anytime to unlock higher-paying surveys and premium features.
          </p>
        </div>

        {/* Current Subscription Banner */}
        {subscriptionStatus?.has_active_subscription && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  You're on the <strong>{subscriptionStatus.plan?.name}</strong> plan
                </p>
                {subscriptionStatus.end_date && (
                  <p className="text-sm text-green-700">
                    Renews on {new Date(subscriptionStatus.end_date).toLocaleDateString('en-KE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate('/overview')}
              className="text-sm font-medium text-green-700 hover:text-green-900 flex items-center gap-1"
            >
              View Dashboard <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const current = isCurrentPlan(plan);
            const aboveTier = isAboveCurrentTier(plan);
            const hasTrial = plan.trial_days > 0;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 p-6 shadow-sm transition-all ${
                  current
                    ? 'border-amber-500 ring-2 ring-amber-200'
                    : aboveTier
                    ? 'border-gray-200 opacity-75 hover:opacity-100'
                    : 'border-gray-200 hover:border-amber-300 hover:shadow-md'
                }`}
              >
                {/* Active Badge */}
                {current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow">
                      ACTIVE
                    </span>
                  </div>
                )}

                {/* Trial Badge */}
                {hasTrial && !current && (
                  <div className="absolute -top-3 right-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {plan.trial_days}-day trial
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800 capitalize">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {plan.is_free ? (
                    <div className="text-3xl font-bold text-gray-800">Free</div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-800">KES {plan.price_kes}</span>
                        <span className="text-gray-500">/{plan.duration_days} days</span>
                      </div>
                      {hasTrial && (
                        <p className="text-xs text-green-600 mt-1">
                          Start with {plan.trial_days} days free, then {plan.price_kes}/month
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {current ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 bg-green-100 text-green-700 font-semibold rounded-xl cursor-default flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    Current Plan
                  </button>
                ) : plan.is_free ? (
                  <button
                    onClick={() => handleActivateFreePlan(plan.id)}
                    disabled={activatingFreePlan === plan.id}
                    className={`w-full py-3 px-4 font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${
                      activatingFreePlan === plan.id
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                    }`}
                  >
                    {activatingFreePlan === plan.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Activating...
                      </>
                    ) : (
                      <>
                        Activate Free
                        <ArrowRightIcon className="w-5 h-5" />
                      </>
                    )}
                  </button>
                ) : aboveTier ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 bg-gray-100 text-gray-400 font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                    title={`Upgrade to ${subscriptionStatus?.plan?.name || 'a lower tier'} first`}
                  >
                    <ShieldIcon className="w-5 h-5" />
                    Upgrade to Unlock
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    Subscribe
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                )}

                {/* Security Note */}
                <p className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                  <ShieldIcon className="w-3 h-3" />
                  Secured by M-Pesa STK Push
                </p>
              </div>
            );
          })}
        </div>

        {/* FAQ / Help Section */}
        <div className="mt-16 text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Questions?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-1">Can I change plans later?</h3>
              <p className="text-sm text-gray-600">Yes! Upgrade or downgrade anytime. Changes take effect on your next billing cycle.</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-1">What if I cancel?</h3>
              <p className="text-sm text-gray-600">Cancel anytime. Your access continues until the end of your paid period — no refunds, no penalties.</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-1">Need help?</h3>
              <p className="text-sm text-gray-600">Contact support@qezzykenya.company or use the in-app chat for assistance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fallback XIcon for error state
const XIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default SubscriptionsPage;