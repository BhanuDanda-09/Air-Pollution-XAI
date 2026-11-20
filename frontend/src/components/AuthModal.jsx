import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, setAuthModalMode, login, register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authModalMode === 'login') {
        await login(email, password);
      } else {
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }
        await register(email, password, name);
      }
      // Reset form on success
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={closeAuthModal}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Background Gradient */}
        <div className="bg-gradient-to-r from-navy-900 via-blue-900 to-indigo-900 px-6 pt-6 pb-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                <ShieldCheck className="w-5 h-5 text-teal-300" />
              </div>
              <h2 id="auth-modal-title" className="text-xl font-bold tracking-tight">
                {authModalMode === 'login' ? 'Sign In' : 'Create Account'}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeAuthModal}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-xs text-blue-200/90 leading-relaxed">
            {authModalMode === 'login'
              ? 'Access your saved places, exposure timeline, and personalized health settings.'
              : 'Save places like Home & Work, customize vulnerability alerts, and track air quality.'}
          </p>

          {/* Tab Switcher */}
          <div className="flex mt-4 p-1 rounded-xl bg-navy-950/40 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                authModalMode === 'login'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                authModalMode === 'register'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name or Alias <span className="text-slate-500 dark:text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
              {authModalMode === 'register' && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Min 8 characters</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{authModalMode === 'login' ? 'Sign In' : 'Create Free Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Guest Continuity Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Prefer not to sign in?</span>
            <button
              type="button"
              onClick={closeAuthModal}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Continue as Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
