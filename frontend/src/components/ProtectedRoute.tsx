// src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // While loading auth state, show nothing or loader
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If no user, redirect to login, and remember where they wanted to go
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user exists but not onboarded → redirect to onboarding
  if (!currentUser.is_onboarded) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  // If user is onboarded but not active → redirect to activation
  if (!currentUser.is_active) {
    return <Navigate to="/activation" replace />;
  }

  // Otherwise, allow access
  return <Outlet />;
};

export default ProtectedRoute;