// src/App.tsx
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { useEffect } from 'react';
import { GlobalToastHandler } from './components/GlobalToastHandler';
import MaintenancePage from './pages/MaintenancePage';
import LoginPage from './pages/LoginPage';
import ProfileCompletionPage from './pages/onboarding/ProfileCompletionPage';
import PaymentDetailsPage from './pages/onboarding/PaymentDetailsPage';
import ActivationPage from './pages/ActivationPage';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import WalletPage from './pages/WalletPage';
import WithdrawalPage from './pages/WithdrawalPage';
import ProfilePage from './pages/ProfilePage';
import JobsPage from './pages/JobsPage';
import SupportPage from './pages/SupportPage';
import LandingPage from './pages/LandingPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CookiesPage from './pages/CookiesPage';
import NotFound from './pages/NotFoundPage';
import AboutPage from './pages/AboutPage';
import BasicProtectedRoute from './components/BasicProtectedRoute';
import JobsProtectedRoute from './components/JobsProtectedRoute';
import OnboardingProtectedRoute from './components/OnboardingProtectedRoute';

const IS_UNDER_MAINTENANCE = false;
function useReferralTracker() {
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      sessionStorage.setItem('referral_code', refCode);
      window.history.replaceState({}, document.title, location.pathname + location.hash);
    }
  }, [location.search]);
}

function AppContent() {
  useReferralTracker();

  return (
    <>
      <GlobalToastHandler />
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* ===== ONBOARDING ROUTES ===== */}
        <Route element={<OnboardingProtectedRoute />}>
          <Route path="/onboarding/profile" element={<ProfileCompletionPage />} />
          <Route path="/onboarding/payment" element={<PaymentDetailsPage />} />
          <Route path="/activation" element={<ActivationPage />} />
        </Route>

        {/* ===== FULLY PROTECTED DASHBOARD ROUTES ===== */}
        <Route element={<BasicProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/withdraw" element={<WithdrawalPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/support" element={<SupportPage />} />
          </Route>
        </Route>

        {/* ===== JOBS ROUTE ===== */}
        <Route element={<JobsProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/jobs" element={<JobsPage />} />
          </Route>
        </Route>

        {/* ===== 404 ===== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {

  if (IS_UNDER_MAINTENANCE) {
    return (
      <Router>
        <MaintenancePage />
      </Router>
    );
  }
 
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;