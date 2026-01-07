// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { auth } from '../firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
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
const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const inactivityTimer = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // 🔁 Reset inactivity timer (throttled)
  const resetInactivityTimer = () => {
    if (!currentUser) return;

    const now = Date.now();
    if (now - lastActivityRef.current < 1000) return; // throttle to 1s

    lastActivityRef.current = now;

    if (inactivityTimer.current !== null) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }

    inactivityTimer.current = window.setTimeout(() => {
      console.log('Auto-logout due to inactivity');
      handleLogout();
    }, INACTIVITY_TIMEOUT);
  };

  // 🚪 Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('firebase_id_token');
      setCurrentUser(null);

      if (inactivityTimer.current !== null) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 🔄 Refresh user profile
  const refreshUser = async () => {
    const token = localStorage.getItem('firebase_id_token');
    if (!token) {
      setCurrentUser(null);
      return;
    }

    try {
      const res = await api.get('/users/me/');
      setCurrentUser(res.data);
      resetInactivityTimer();
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setCurrentUser(null);
    }
  };

  // 🔑 Get Firebase ID token
  const getIdToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;

    return user.getIdToken();
  };

  // 🔐 Google login
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const token = await result.user.getIdToken();
      localStorage.setItem('firebase_id_token', token);

      const res = await api.get('/users/me/');
      setCurrentUser(res.data);
      resetInactivityTimer();
    } catch (error) {
      console.error('Login error:', error);
      setCurrentUser(null);
      throw error;
    }
  };

  // 🖱️ Global activity listeners (registered ONCE)
  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'touchmove',
      'scroll',
      'wheel',
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, {
        passive: true,
        capture: true,
      });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer, true);
      });
    };
  }, []);

  // 🔥 Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        localStorage.setItem('firebase_id_token', token);

        try {
          const res = await api.get('/users/me/');
          setCurrentUser(res.data);
          resetInactivityTimer();
        } catch (error) {
          console.error('Failed to fetch user:', error);
          setCurrentUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        localStorage.removeItem('firebase_id_token');
        setCurrentUser(null);
        setLoading(false);

        if (inactivityTimer.current !== null) {
          clearTimeout(inactivityTimer.current);
          inactivityTimer.current = null;
        }
      }
    });

    return () => {
      unsubscribe();
      if (inactivityTimer.current !== null) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    loginWithGoogle,
    logout: handleLogout,
    getIdToken,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
