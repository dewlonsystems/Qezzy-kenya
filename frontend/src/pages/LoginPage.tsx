// src/pages/LoginPage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

const LoginPage = () => {
  const { currentUser, loading: authLoading } = useAuth(); // 🔥 Removed loginWithGoogle
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [activeMethod, setActiveMethod] = useState<'google' | 'email'>('google');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Redirect for existing users (via AuthContext)
  useEffect(() => {
    if (currentUser) {
      if (!currentUser.is_onboarded) {
        navigate('/onboarding/profile');
      } else if (!currentUser.is_active) {
        navigate('/activation');
      } else {
        navigate('/');
      }
    }
  }, [currentUser, navigate]);

  // 🔥 Unified post-auth check for NEW users
  const checkNewUserAndRedirect = async (token: string) => {
    try {
      const response = await fetch('/api/users/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Existing user — AuthContext will set currentUser and trigger useEffect
        return;
      }

      // If not OK (403, 404, etc.), treat as NEW user
      navigate('/onboarding/profile');
    } catch (err) {
      // On network error, assume new user (safe default)
      navigate('/onboarding/profile');
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    try {
      setError('');
      setLoading(true);

      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const token = await result.user.getIdToken();
      localStorage.setItem('firebase_id_token', token);

      // 🔥 Immediately check if new user
      await checkNewUserAndRedirect(token);
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let userCredential;
      if (authMode === 'signin') {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      const token = await userCredential.user.getIdToken();
      localStorage.setItem('firebase_id_token', token);

      // 🔥 Immediately check if new user
      await checkNewUserAndRedirect(token);
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Try signing in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || authLoading;

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 transition-all duration-300">
            {authMode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
          </h1>
          <p className="text-gray-600 transition-all duration-300">
            {authMode === 'signin'
              ? 'Sign in to continue earning'
              : 'Join to start completing tasks and earning rewards'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm animate-fadeIn">
            {error}
          </div>
        )}

        <div className="flex bg-white rounded-xl p-1 shadow-sm mb-6 border border-amber-100">
          <button
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeMethod === 'google'
                ? 'bg-amber-100 text-amber-800 shadow-sm'
                : 'text-gray-600 hover:text-amber-700'
            }`}
            onClick={() => setActiveMethod('google')}
            disabled={isSubmitting}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.66-2.08z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </div>
          </button>
          <button
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeMethod === 'email'
                ? 'bg-amber-100 text-amber-800 shadow-sm'
                : 'text-gray-600 hover:text-amber-700'
            }`}
            onClick={() => setActiveMethod('email')}
            disabled={isSubmitting}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Email
            </div>
          </button>
        </div>

        {activeMethod === 'google' && (
          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-amber-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 font-medium"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.66-2.08z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        )}

        {activeMethod === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition"
              required
              disabled={isSubmitting}
            />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition"
              required
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : authMode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            className="text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1 mx-auto transition-colors"
            disabled={isSubmitting}
          >
            {authMode === 'signin' ? (
              <>
                <span>Don't have an account?</span>
                <span className="font-bold">Sign up</span>
              </>
            ) : (
              <>
                <span>Already have an account?</span>
                <span className="font-bold">Sign in</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;