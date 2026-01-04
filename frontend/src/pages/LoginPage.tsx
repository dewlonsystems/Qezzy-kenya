// src/pages/LoginPage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

// Google Fonts: Inter


const LoginPage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Auth flow state
  const [authStep, setAuthStep] = useState<'user-type' | 'auth-method' | 'email-form'>('user-type');
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🔁 Redirect if already authenticated
  useEffect(() => {
    if (currentUser) {
      if (!currentUser.is_onboarded) {
        navigate('/onboarding/profile');
      } else if (!currentUser.is_active) {
        navigate('/activation');
      } else {
        navigate('/overview');
      }
    }
  }, [currentUser, navigate]);

  // 🔥 Unified new user check
  const checkNewUserAndRedirect = async (token: string) => {
    try {
      const response = await fetch('/api/users/me/', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        return; // existing user → AuthContext handles redirect
      }
      navigate('/onboarding/profile');
    } catch {
      navigate('/onboarding/profile');
    }
  };

  // Google Auth
  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const token = await result.user.getIdToken();
      localStorage.setItem('firebase_id_token', token);
      await checkNewUserAndRedirect(token);
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Email Auth
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isNewUser && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (isNewUser && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      if (isNewUser) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const token = await userCredential.user.getIdToken();
      localStorage.setItem('firebase_id_token', token);
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

  const goBack = () => {
    if (authStep === 'email-form') {
      setAuthStep('auth-method');
    } else if (authStep === 'auth-method') {
      setAuthStep('user-type');
      setIsNewUser(null);
    }
    setError('');
  };

  const resetFlow = () => {
    setAuthStep('user-type');
    setIsNewUser(null);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const isSubmitting = loading || authLoading;

  // Password strength checks (only for signup)
  const passwordChecks = isNewUser
    ? [
        { label: 'At least 8 characters', valid: password.length >= 8 },
        { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
        { label: 'One number', valid: /[0-9]/.test(password) },
      ]
    : [];

  // Step indicator
  const getStepIndicator = () => {
    const steps = ['user-type', 'auth-method', 'email-form'];
    const currentIndex = steps.indexOf(authStep);
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index <= currentIndex ? 'bg-amber-500 w-8' : 'bg-gray-200 w-4'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex font-sans overflow-x-hidden">
        {/* Left Branding Panel (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 to-amber-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
            <div className="mb-8">
              <span className="text-3xl font-bold">
                Qezzy<span className="text-amber-100">Kenya</span>
              </span>
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              {isNewUser === null
                ? 'Your Journey to Extra Income Starts Here'
                : isNewUser
                ? 'Start Your Earning Journey Today'
                : 'Welcome Back, Earner!'}
            </h1>
            
            <p className="text-lg text-amber-100/90 mb-8 max-w-md">
              {isNewUser === null
                ? 'Join thousands of Kenyans earning extra income by completing simple online tasks.'
                : isNewUser
                ? 'No experience needed. Earn instantly via M-Pesa.'
                : 'Your tasks and earnings are waiting. Sign in to continue.'}
            </p>

            <div className="space-y-3">
              {[
                'Earn KES 50–500 per task',
                'Instant M-Pesa withdrawals',
                'Work from anywhere, anytime',
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-200" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <span className="text-2xl font-bold text-gray-800">
                Qezzy<span className="text-amber-600">Kenya</span>
              </span>
            </div>

            {/* Step Progress */}
            {getStepIndicator()}

            {/* Auth Flow Container */}
            <div className="relative min-h-[420px]">
              
              {/* Step 1: User Type */}
              <div
                className={`transition-all duration-500 ${
                  authStep === 'user-type'
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-full absolute inset-0 pointer-events-none'
                }`}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Let's get started</h2>
                  <p className="text-gray-600">Are you new here or returning?</p>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewUser(true);
                      setAuthStep('auth-method');
                    }}
                    className="w-full p-6 rounded-2xl border border-gray-200 bg-white hover:border-amber-400 hover:shadow-md transition-all group text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-6-6v3m0 0v3m0-3h3m-3 0H9m6 6v3m0 0v3m0-3h3m-3 0h-3" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-amber-700">I'm new here</h3>
                        <p className="text-sm text-gray-600">Create an account and start earning today</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsNewUser(false);
                      setAuthStep('auth-method');
                    }}
                    className="w-full p-6 rounded-2xl border border-gray-200 bg-white hover:border-amber-400 hover:shadow-md transition-all group text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-amber-700">I have an account</h3>
                        <p className="text-sm text-gray-600">Sign in to access your tasks and earnings</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Auth Method */}
              <div
                className={`transition-all duration-500 ${
                  authStep === 'auth-method'
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-full absolute inset-0 pointer-events-none'
                }`}
              >
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">Back</span>
                </button>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {isNewUser ? 'Create your account' : 'Welcome back'}
                  </h2>
                  <p className="text-gray-600">
                    Choose how you'd like to {isNewUser ? 'sign up' : 'sign in'}
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="w-full p-5 rounded-2xl border border-gray-200 bg-white hover:border-amber-300 hover:shadow-md transition-all disabled:opacity-60"
                  >
                    <div className="flex items-center justify-center gap-4">
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-amber-500 rounded-full animate-spin" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-5 h-5">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.66-2.08z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      )}
                      <span className="font-medium">
                        {isSubmitting ? 'Connecting...' : 'Continue with Google'}
                      </span>
                    </div>
                  </button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gray-50 px-4 text-gray-500 font-medium">or</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAuthStep('email-form')}
                    className="w-full p-5 rounded-2xl border border-gray-200 bg-white hover:border-amber-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                        <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-medium">Continue with Email</span>
                    </div>
                  </button>
                </div>

                <p className="mt-6 text-center text-sm text-gray-600">
                  {isNewUser ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={resetFlow}
                    className="text-amber-600 font-medium hover:underline"
                  >
                    {isNewUser ? 'Sign in instead' : 'Create one'}
                  </button>
                </p>
              </div>

              {/* Step 3: Email Form */}
              <div
                className={`transition-all duration-500 ${
                  authStep === 'email-form'
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-full absolute inset-0 pointer-events-none'
                }`}
              >
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">Back to options</span>
                </button>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {isNewUser ? 'Create your account' : 'Sign in with email'}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {isNewUser ? 'Fill in your details to get started' : 'Enter your credentials to continue'}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEmailAuth} className="space-y-4">               

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      {!isNewUser && (
                        <button
                          type="button"
                          className="text-sm text-amber-600 hover:underline"
                          onClick={() => alert('Password reset not implemented')}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={isNewUser ? 'Create a strong password' : 'Enter your password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {isNewUser && (
                    <>
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                            required
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Password Strength */}
                      <div className="mt-2 space-y-1">
                        {passwordChecks.map((check, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <svg
                              className={`w-3.5 h-3.5 ${
                                check.valid ? 'text-green-600' : 'text-gray-400'
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className={check.valid ? 'text-green-600' : 'text-gray-500'}>
                              {check.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {isNewUser ? 'Creating account...' : 'Signing in...'}
                      </>
                    ) : isNewUser ? (
                      <>
                        Create Account
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        Sign In
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-gray-500">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-amber-600 hover:underline">Terms of Service</a>
              {' and '}
              <a href="/privacy" className="text-amber-600 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;