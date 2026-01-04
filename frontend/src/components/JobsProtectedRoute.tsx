// src/components/JobsProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner'; // ✅ ADD THIS

const JobsProtectedRoute = () => {
  const { currentUser, loading: authLoading, getIdToken } = useAuth();
  const location = useLocation();
  const [validationState, setValidationState] = useState<{
    loading: boolean;
    shouldRedirectToLogin: boolean;
    redirectToOnboarding: boolean;
    redirectToActivation: boolean;
  }>({
    loading: true,
    shouldRedirectToLogin: false,
    redirectToOnboarding: false,
    redirectToActivation: false,
  });

  useEffect(() => {
    const validateUser = async () => {
      setValidationState({
        loading: true,
        shouldRedirectToLogin: false,
        redirectToOnboarding: false,
        redirectToActivation: false,
      });

      try {
        if (!currentUser) {
          setValidationState({ loading: false, shouldRedirectToLogin: true, redirectToOnboarding: false, redirectToActivation: false });
          return;
        }

        const token = await getIdToken();
        if (!token) {
          setValidationState({ loading: false, shouldRedirectToLogin: true, redirectToOnboarding: false, redirectToActivation: false });
          return;
        }

        const res = await api.get('/users/me/');
        const user = res.data;

        if (user.is_closed) {
          setValidationState({ loading: false, shouldRedirectToLogin: true, redirectToOnboarding: false, redirectToActivation: false });
        } else if (!user.is_onboarded) {
          setValidationState({ loading: false, shouldRedirectToLogin: false, redirectToOnboarding: true, redirectToActivation: false });
        } else if (!user.is_active) {
          setValidationState({ loading: false, shouldRedirectToLogin: false, redirectToOnboarding: false, redirectToActivation: true });
        } else {
          setValidationState({ loading: false, shouldRedirectToLogin: false, redirectToOnboarding: false, redirectToActivation: false });
        }
      } catch (err) {
        setValidationState({ loading: false, shouldRedirectToLogin: true, redirectToOnboarding: false, redirectToActivation: false });
      }
    };

    validateUser();
  }, [currentUser, getIdToken]);

  // ✅ SHOW BRANDED SPINNER WHILE AUTH/VALIDATION IS IN PROGRESS
  if (authLoading || validationState.loading) {
    return <LoadingSpinner message="Checking job access..." />;
  }

  if (validationState.shouldRedirectToLogin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (validationState.redirectToOnboarding) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  if (validationState.redirectToActivation) {
    return <Navigate to="/activation" replace />;
  }

  return <Outlet />;
};

export default JobsProtectedRoute;