// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('firebase_id_token');
    if (!token) {
      setCurrentUser(null);
      return;
    }

    try {
      const res = await api.get('/users/me/');
      setCurrentUser(res.data);
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
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        localStorage.setItem('firebase_id_token', token);
        try {
          const res = await api.get('/users/me/');
          setCurrentUser(res.data);
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
  }, []);

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