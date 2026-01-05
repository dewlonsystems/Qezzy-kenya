// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom'; // ✅ Safe because AuthProvider is inside Router
import api from '../api/client';
import type { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate(); // ✅ Now safe!
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [inactivityTimer, setInactivityTimer] = useState<number | null>(null);

  // ✅ Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer !== null) {
      clearTimeout(inactivityTimer);
    }

    const newTimer = setTimeout(() => {
      console.log('Auto-logout due to 3 minutes of inactivity');
      handleAutoLogout();
    }, 180_000); // 3 minutes

    setInactivityTimer(newTimer);
  }, [inactivityTimer]);

  const handleAutoLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('firebase_id_token');
    setCurrentUser(null);
    navigate('/login', { replace: true });
  };

  // ✅ Start/reset timer when user is authenticated
  useEffect(() => {
    if (currentUser) {
      resetInactivityTimer();

      // Listen to user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => window.addEventListener(event, resetInactivityTimer));

      return () => {
        events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
        if (inactivityTimer !== null) {
          clearTimeout(inactivityTimer);
          setInactivityTimer(null);
        }
      };
    } else {
      // Clear timer when logged out
      if (inactivityTimer !== null) {
        clearTimeout(inactivityTimer);
        setInactivityTimer(null);
      }
    }
  }, [currentUser, resetInactivityTimer, inactivityTimer]);

  const refreshUser = async () => {
    const token = localStorage.getItem('firebase_id_token');
    if (!token) {
      setCurrentUser(null);
      return;
    }

    try {
      const res = await api.get('/users/me/');
      setCurrentUser(res.data);
      // Refreshing user = recent activity → reset timer
      if (res.data) resetInactivityTimer();
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      setCurrentUser(null);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (user) {
      const tokenResult = await user.getIdTokenResult();
      return tokenResult.token;
    }
    return null;
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const token = await result.user.getIdToken();
      localStorage.setItem('firebase_id_token', token);
      
      try {
        const res = await api.get('/users/me/');
        setCurrentUser(res.data);
        resetInactivityTimer(); // Start timer after login
      } catch (error: any) {
        if (error.response?.status === 403) {
          setCurrentUser(null);
        } else {
          console.error('Failed to fetch user profile:', error);
          setCurrentUser(null);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('firebase_id_token');
    setCurrentUser(null);
    // Timer will be cleared by useEffect above
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        localStorage.setItem('firebase_id_token', token);
        try {
          const res = await api.get('/users/me/');
          setCurrentUser(res.data);
          resetInactivityTimer(); // Start timer on auth state change
        } catch (error: any) {
          if (error.response?.status === 403) {
            setCurrentUser(null);
          } else {
            console.error('Failed to fetch user:', error);
            setCurrentUser(null);
          }
        } finally {
          setLoading(false);
        }
      } else {
        localStorage.removeItem('firebase_id_token');
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [resetInactivityTimer]);

  const value = {
    currentUser,
    loading,
    loginWithGoogle,
    logout,
    getIdToken,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};