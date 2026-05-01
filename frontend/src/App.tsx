import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { useEffect } from 'react';
import { GlobalToastHandler } from './components/GlobalToastHandler';
import MaintenancePage from './pages/MaintenancePage';
import LoginPage from './pages/LoginPage';
import ProfileCompletionPage from './pages/onboarding/ProfileCompletionPage';
import PaymentDetailsPage from './pages/onboarding/PaymentDetailsPage';
// ✅ UPDATED: BillingPage for subscription payments (replaces deprecated ActivationPage)
import BillingPage from './pages/BillingPage';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import WalletPage from './pages/WalletPage';
import WithdrawalPage from './pages/WithdrawalPage';
import ProfilePage from './pages/ProfilePage';
// ✅ UPDATED: SurveysPage (renamed from JobsPage)
import SurveysPage from './pages/SurveysPage';
import SupportPage from './pages/SupportPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CookiesPage from './pages/CookiesPage';
import NotFound from './pages/NotFoundPage';
import AboutPage from './pages/AboutPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
// 🆕 Email Preferences (token-based, no login required)
import EmailPreferencesPage from './pages/EmailPreferencesPage';
// ✅ UPDATED: SurveysProtectedRoute (renamed from JobsProtectedRoute)
import BasicProtectedRoute from './components/BasicProtectedRoute';
import SurveysProtectedRoute from './components/SurveysProtectedRoute';
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
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />
        {/* 🆕 Email Preferences (token-based, no login required) */}
        <Route path="/email-preferences/:token" element={<EmailPreferencesPage />} />

        {/* ===== ONBOARDING ROUTES ===== */}
        <Route element={<OnboardingProtectedRoute />}>
          <Route path="/onboarding/profile" element={<ProfileCompletionPage />} />
          <Route path="/onboarding/payment" element={<PaymentDetailsPage />} />
          {/* ✅ REMOVED: /activation is deprecated — users go straight to /overview after onboarding */}
        </Route>

        {/* ===== FULLY PROTECTED DASHBOARD ROUTES ===== */}
        <Route element={<BasicProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/withdraw" element={<WithdrawalPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
          </Route>
        </Route>

        {/* ===== SURVEYS ROUTE (tier-protected) ===== */}
        <Route element={<SurveysProtectedRoute requiredTierLevel={0} />}>
          <Route element={<DashboardLayout />}>
            {/* ✅ UPDATED: /surveys path + SurveysPage component */}
            <Route path="/surveys" element={<SurveysPage />} />
          </Route>
        </Route>

        {/* ===== BILLING ROUTE (payment flow for upgrades) ===== */}
        <Route element={<BasicProtectedRoute />}>
          {/* ✅ NEW: Dedicated billing page for STK Push payments */}
          <Route path="/billing" element={<BillingPage />} />
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