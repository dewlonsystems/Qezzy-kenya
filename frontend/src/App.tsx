// src/App.tsx
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
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes - no layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding/profile" element={<ProfileCompletionPage />} />
          <Route path="/onboarding/payment" element={<PaymentDetailsPage />} />
          <Route path="/activation" element={<ActivationPage />} />

          {/* Protected routes - with dashboard layout */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/withdraw" element={<WithdrawalPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;