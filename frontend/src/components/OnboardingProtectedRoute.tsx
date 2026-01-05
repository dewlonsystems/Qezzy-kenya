// src/components/OnboardingProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const OnboardingProtectedRoute = () => {
  const { currentUser, loading: authLoading, getIdToken } = useAuth();
  const [tokenVerified, setTokenVerified] = useState(false);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      // Wait for Firebase auth state to settle
      if (authLoading) return;

      // If no user, redirect
      if (!currentUser) {
        setShouldRedirectToLogin(true);
        return;
      }

      try {
        // ✅ Get fresh ID token (validates session with Firebase)
        const token = await getIdToken();
        if (!token) {
          setShouldRedirectToLogin(true);
          return;
        }

        // Optional: you could send token to your backend to verify (e.g., /auth/verify)
        // But for onboarding, Firebase-side validation is usually enough

        setTokenVerified(true);
      } catch (error) {
        console.error('Token verification failed:', error);
        setShouldRedirectToLogin(true);
      }
    };

    verifyToken();
  }, [currentUser, authLoading, getIdToken]);

  // Show loading while verifying
  if (authLoading || !tokenVerified) {
    if (shouldRedirectToLogin) {
      return <Navigate to="/login" replace />;
    }
    return <LoadingSpinner message="Securing your session..." />;
  }

  if (shouldRedirectToLogin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default OnboardingProtectedRoute;