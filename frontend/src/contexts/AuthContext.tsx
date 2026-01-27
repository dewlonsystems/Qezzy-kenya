// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import api from '../api/client';
import type { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  accountClosed: boolean;
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
  const [accountClosed, setAccountClosed] = useState(false);
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

  // Enhanced logout with timer and session cleanup
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('firebase_id_token');
      sessionStorage.removeItem('login-toast-shown'); // 👈 clear login toast flag
      setCurrentUser(null);
      setAccountClosed(false);

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
      setAccountClosed(false);
      return;
    }

    try {
      const res = await api.get('/users/me/');
      setCurrentUser(res.data);
      setAccountClosed(false);
      resetInactivityTimer();
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      setCurrentUser(null);
      setAccountClosed(false);
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
        setAccountClosed(false);
        resetInactivityTimer();
      } catch (error: any) {
        if (error.response?.status === 403) {
          try {
            const data = error.response.data;
            if (data?.error && data.error.includes('Account closed')) {
              setAccountClosed(true);
              setCurrentUser(null);
              await signOut(auth);
              localStorage.removeItem('firebase_id_token');
              return;
            }
          } catch (e) {
            console.warn('Could not parse error response');
          }
        }
        console.error('Failed to fetch user profile:', error);
        setCurrentUser(null);
        setAccountClosed(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Set up global activity listeners (enhanced for mobile)
  useEffect(() => {
    const events = [
      'mousedown', 'mousemove', 'mouseup',
      'keydown', 'keypress', 'keyup',
      'touchstart', 'touchmove', 'touchend',
      'scroll',
      'wheel'
    ];

    const addListeners = () => {
      events.forEach(event => {
        if (event === 'scroll' || event === 'wheel') {
          window.addEventListener(event, resetInactivityTimer, { passive: true } as EventListenerOptions);
        } else {
          window.addEventListener(event, resetInactivityTimer, true);
        }
      });
    };

    const removeListeners = () => {
      events.forEach(event => {
        if (event === 'scroll' || event === 'wheel') {
          window.removeEventListener(event, resetInactivityTimer, { passive: true } as EventListenerOptions);
        } else {
          window.removeEventListener(event, resetInactivityTimer, true);
        }
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
          setAccountClosed(false);
          resetInactivityTimer();
        } catch (error: any) {
          if (error.response?.status === 403) {
            try {
              const data = error.response.data;
              if (data?.error && data.error.includes('Account closed')) {
                setAccountClosed(true);
                setCurrentUser(null);
                await signOut(auth);
                localStorage.removeItem('firebase_id_token');
              } else {
                setCurrentUser(null);
                setAccountClosed(false);
              }
            } catch (e) {
              console.warn('Could not parse error response');
              setCurrentUser(null);
              setAccountClosed(false);
            }
          } else {
            console.error('Failed to fetch user:', error);
            setCurrentUser(null);
            setAccountClosed(false);
          }
        } finally {
          setLoading(false);
        }
      } else {
        localStorage.removeItem('firebase_id_token');
        sessionStorage.removeItem('login-toast-shown');
        setCurrentUser(null);
        setAccountClosed(false);
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
    accountClosed,
    loading,
    loginWithGoogle,
    logout: handleLogout,
    getIdToken,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};