// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
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

// 🔒 Auto-logout after 3 minutes of inactivity
const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef<number | null>(null);

  // Reset inactivity timer on any user activity
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    if (currentUser) {
      inactivityTimer.current = setTimeout(() => {
        console.log('Auto-logout due to inactivity');
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Enhanced logout with timer cleanup
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('firebase_id_token');
      setCurrentUser(null);

      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('firebase_id_token');
    if (!token) {
      setCurrentUser(null);
      return;
    }

    try {
      const res = await api.get('/users/me/');
      setCurrentUser(res.data);
      resetInactivityTimer(); // Start timer when user is active
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

  // Set up global activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    const addListeners = () => {
      events.forEach(event => {
        window.addEventListener(event, resetInactivityTimer, true);
      });
    };

    const removeListeners = () => {
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer, true);
      });
    };

    addListeners();
    return removeListeners;
  }, [currentUser]);

  // Auth state listener
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

        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
          inactivityTimer.current = null;
        }
      }
    });

    return () => {
      unsubscribe();
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, []);

  const value = {
    currentUser,
    loading,
    loginWithGoogle,
    logout: handleLogout,
    getIdToken,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};