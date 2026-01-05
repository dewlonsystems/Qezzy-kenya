// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // ✅ Moved here
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
      <AuthProvider> {/* ✅ NOW inside Router → useNavigate() works! */}
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/login" element={<LoginPage />} />          
          <Route path="/onboarding/payment" element={<PaymentDetailsPage />} />
          <Route path="/onboarding/profile" element={<ProfileCompletionPage />} />         

          {/* Protected routes */}
          <Route element={<BasicProtectedRoute />}>
            {/* Onboarding — no layout */}            
            <Route path="/activation" element={<ActivationPage />} />
            

            {/* Dashboard — with layout */}
            <Route element={<DashboardLayout />}>
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/withdraw" element={<WithdrawalPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/support" element={<SupportPage />} />
            </Route>
          </Route>

          {/* Jobs — special protection */}
          <Route element={<JobsProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/jobs" element={<JobsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;