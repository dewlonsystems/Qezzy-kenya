import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

// Optional: Allow per-route tier enforcement via prop
interface SurveysProtectedRouteProps {
  requiredTierLevel?: number; // 0=Free, 1=Basic, 2=Standard, 3=Premium, 4=Elite
}

interface SubscriptionStatus {
  has_active_subscription: boolean;
  current_tier: string | null;
  tier_level: number;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  end_date: string | null;
  grace_end_date: string | null;
  is_trial: boolean;
}

const SurveysProtectedRoute = ({ requiredTierLevel = 0 }: SurveysProtectedRouteProps) => {
  const { currentUser, loading: authLoading, getIdToken } = useAuth();
  const location = useLocation();
  const [validationState, setValidationState] = useState<{
    loading: boolean;
    shouldRedirectToLogin: boolean;
    redirectToOnboarding: boolean;
    redirectToSubscriptions: boolean;
    insufficientTier: boolean;
  }>({
    loading: true,
    shouldRedirectToLogin: false,
    redirectToOnboarding: false,
    redirectToSubscriptions: false,
    insufficientTier: false,
  });

  useEffect(() => {
    const validateUser = async () => {
      setValidationState({
        loading: true,
        shouldRedirectToLogin: false,
        redirectToOnboarding: false,
        redirectToSubscriptions: false,
        insufficientTier: false,
      });

      try {
        // 1. Check authentication
        if (!currentUser) {
          setValidationState({ 
            loading: false, 
            shouldRedirectToLogin: true, 
            redirectToOnboarding: false, 
            redirectToSubscriptions: false,
            insufficientTier: false,
          });
          return;
        }

        const token = await getIdToken();
        if (!token) {
          setValidationState({ 
            loading: false, 
            shouldRedirectToLogin: true, 
            redirectToOnboarding: false, 
            redirectToSubscriptions: false,
            insufficientTier: false,
          });
          return;
        }

        // 2. Fetch user + subscription status in parallel
        const [userRes, subRes] = await Promise.all([
          api.get('/users/me/'),
          api.get('/api/subscriptions/status/'),
        ]);

        const user = userRes.data;
        const subscription: SubscriptionStatus = subRes.data;

        // 3. Account closed → block access
        if (user.is_closed) {
          setValidationState({ 
            loading: false, 
            shouldRedirectToLogin: true, 
            redirectToOnboarding: false, 
            redirectToSubscriptions: false,
            insufficientTier: false,
          });
          return;
        }

        // 4. Not onboarded → redirect to onboarding
        if (!user.is_onboarded) {
          setValidationState({ 
            loading: false, 
            shouldRedirectToLogin: false, 
            redirectToOnboarding: true, 
            redirectToSubscriptions: false,
            insufficientTier: false,
          });
          return;
        }

        // 5. Tier validation: does user have access to required tier?
        // Free tier (0) is always accessible; paid tiers require matching subscription
        if (requiredTierLevel > 0) {
          const userTier = subscription?.tier_level ?? 0;
          const isWithinGrace = subscription?.grace_end_date 
            ? new Date(subscription.grace_end_date) > new Date() 
            : false;
          
          // Allow access if: user tier >= required OR within grace period
          if (userTier < requiredTierLevel && !isWithinGrace) {
            setValidationState({ 
              loading: false, 
              shouldRedirectToLogin: false, 
              redirectToOnboarding: false, 
              redirectToSubscriptions: true,
              insufficientTier: true,
            });
            return;
          }
        }

        // 6. All checks passed → allow access
        setValidationState({ 
          loading: false, 
          shouldRedirectToLogin: false, 
          redirectToOnboarding: false, 
          redirectToSubscriptions: false,
          insufficientTier: false,
        });

      } catch (err) {
        console.error('Surveys route validation failed:', err);
        // On API error, allow access but log warning (fail-open for UX)
        setValidationState({ 
          loading: false, 
          shouldRedirectToLogin: false, 
          redirectToOnboarding: false, 
          redirectToSubscriptions: false,
          insufficientTier: false,
        });
      }
    };

    validateUser();
  }, [currentUser, getIdToken, requiredTierLevel]);

  // Show loading spinner while validating
  if (authLoading || validationState.loading) {
    return <LoadingSpinner message="Checking survey access..." />;
  }

  // Redirect flows
  if (validationState.shouldRedirectToLogin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (validationState.redirectToOnboarding) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  if (validationState.redirectToSubscriptions) {
    // Pass intent to upgrade in state for targeted UX
    return (
      <Navigate 
        to="/subscriptions" 
        state={{ 
          from: location.pathname,
          message: validationState.insufficientTier 
            ? 'Upgrade to unlock this survey' 
            : undefined 
        }} 
        replace 
      />
    );
  }

  // All checks passed → render child route
  return <Outlet />;
};

export default SurveysProtectedRoute;