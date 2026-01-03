// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding/profile" element={<ProfileCompletionPage />} />
        <Route path="/onboarding/payment" element={<PaymentDetailsPage />} />
        <Route path="/activation" element={<ActivationPage />} />

        {/* Basic protected routes (only require onboarded) */}
        <Route element={<BasicProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/withdraw" element={<WithdrawalPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/support" element={<SupportPage />} />
          </Route>
        </Route>

        {/* Jobs route (requires activation) */}
        <Route element={<JobsProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/jobs" element={<JobsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;