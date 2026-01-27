'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AuthModal({ show, onClose, authMode, setAuthMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const modalRef = useRef(null);
  const firstFocusRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Store previously focused element and lock body scroll
  useEffect(() => {
    if (show) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      // Focus the first input after render
      setTimeout(() => {
        firstFocusRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
      // Restore focus to previously focused element
      previousFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  // Escape key handler
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  // Reset form state when mode changes
  useEffect(() => {
    setAuthError('');
    setSuccessMessage('');
  }, [authMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMessage('');
    setAuthLoading(true);
    try {
      if (authMode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setSuccessMessage('Account created! Please check your email to verify.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-gray-900 rounded-2xl p-4 sm:p-6 w-full max-w-md border border-gray-700 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 id="auth-modal-title" className="text-lg sm:text-xl font-bold text-white">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X size={24} />
          </button>
        </div>
        {authError && (
          <div
            className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-red-400 text-sm"
            role="alert"
          >
            {authError}
          </div>
        )}
        {successMessage && (
          <div
            className="bg-green-500/20 border border-green-500 rounded-lg p-3 mb-4 text-green-400 text-sm"
            role="status"
          >
            {successMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label htmlFor="auth-fullname" className="block text-sm text-gray-400 mb-1">
                Full Name
              </label>
              <input
                id="auth-fullname"
                ref={authMode === 'register' ? firstFocusRef : undefined}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                placeholder="Enter your name"
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="block text-sm text-gray-400 mb-1">
              Email
            </label>
            <input
              id="auth-email"
              ref={authMode === 'login' ? firstFocusRef : undefined}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-sm text-gray-400 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 pr-12"
                placeholder="Enter your password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {authLoading && <Loader2 size={20} className="animate-spin" />}
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-gray-400 mt-4 text-sm sm:text-base">
          {authMode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setAuthMode('register')}
                className="text-green-400 hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setAuthMode('login')}
                className="text-green-400 hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
