// src/components/BasicProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

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
          // ✅ Allow access as long as onboarded (even if not active)
          setValidationState({ loading: false, shouldRedirectToLogin: false, redirectToOnboarding: false });
        }
      } catch (err) {
        setValidationState({ loading: false, shouldRedirectToLogin: true, redirectToOnboarding: false });
      }
    };

    validateUser();
  }, [currentUser, getIdToken]);

  if (authLoading || validationState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
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