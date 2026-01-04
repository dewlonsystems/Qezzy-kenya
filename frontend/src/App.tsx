// src/App.tsx (updated)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import BasicProtectedRoute from './components/BasicProtectedRoute';
import JobsProtectedRoute from './components/JobsProtectedRoute';
import LandingPage from './pages/LandingPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CookiesPage from './pages/CookiesPage';
import NotFound from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes — fully accessible */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding/profile" element={<ProfileCompletionPage />} />
        <Route path="/onboarding/payment" element={<PaymentDetailsPage />} />
        <Route path="/activation" element={<ActivationPage />} />

        {/* Protected routes — require onboarding */}
        <Route element={<BasicProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/withdraw" element={<WithdrawalPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/support" element={<SupportPage />} />
          </Route>
        </Route>

        {/* Jobs — require activation */}
        <Route element={<JobsProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/jobs" element={<JobsPage />} />
          </Route>
        </Route>

        {/* ✅ Catch-all: show 404 page for any unmatched route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;