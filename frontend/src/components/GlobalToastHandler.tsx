// src/components/GlobalToastHandler.tsx
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const GlobalToastHandler = () => {
  const { currentUser, accountClosed, loading } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (loading) return;

    if (accountClosed) {
      showToast('Your account has been closed. Please contact support for assistance.', 'error');
    } else if (currentUser) {
      // Prevent duplicate "logged in" toast on refresh
      const alreadyShown = sessionStorage.getItem('login-toast-shown');
      if (!alreadyShown) {
        showToast('Logged in successfully!', 'success');
        sessionStorage.setItem('login-toast-shown', 'true');
      }
    }
  }, [currentUser, accountClosed, loading, showToast]);

  return null;
};