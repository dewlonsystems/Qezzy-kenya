// src/components/BasicProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner'; // ✅ ADD THIS

const BasicProtectedRoute = () => {
  const { currentUser, loading: authLoading, getIdToken } = useAuth();
  const location = useLocation();
  const [validationState, setValidationState] = useState<{
    loading: boolean;
    shouldRedirectToLogin: boolean;
    redirectToOnboarding: boolean;
  }>({
    loading: true,
    shouldRedirectToLogin: false,
    redirectToOnboarding: false,
  });

  useEffect(() => {
    const validateUser = async () => {
      setValidationState({
        loading: true,
        shouldRedirectToLogin: false,
        redirectToOnboarding: false,
      });

      try {
        if (!currentUser) {
          setValidationState({ loading: false, shouldRedirectToLogin: true, redirectToOnboarding: false });
          return;
        }

        const token = await getIdToken();
        if (!token) {
          setValidationState({ loading: false, shouldRedirectToLogin: true, redirectToOnboarding: false });
          return;
        }

        const res = await api.get('/users/me/');
        const user = res.data;

        if (user.is_closed) {
          setValidationState({ loading: false, shouldRedirectToLogin: true, redirectToOnboarding: false });
        } else if (!user.is_onboarded) {
          setValidationState({ loading: false, shouldRedirectToLogin: false, redirectToOnboarding: true });
        } else {
          setValidationState({ loading: false, shouldRedirectToLogin: false, redirectToOnboarding: false });
        }
      } catch (err) {
        setValidationState({ loading: false, shouldRedirectToLogin: true, redirectToOnboarding: false });
      }
    };

    validateUser();
  }, [currentUser, getIdToken]);

  // ✅ SHOW BRANDED SPINNER WHILE AUTH/VALIDATION IS IN PROGRESS
  if (authLoading || validationState.loading) {
    return <LoadingSpinner message="Verifying your session..." />;
  }

  if (validationState.shouldRedirectToLogin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (validationState.redirectToOnboarding) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  return <Outlet />;
};

export default BasicProtectedRoute;