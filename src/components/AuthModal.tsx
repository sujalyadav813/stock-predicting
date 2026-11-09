import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Lock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { signInWithGoogle } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed-by-user')) {
        setError('Google sign-in popup was closed before completing. Please try again.');
      } else if (msg.includes('popup-blocked')) {
        setError('Popup was blocked by your browser. Please allow popups for this applet.');
      } else {
        setError('Authentication failed. Please try again or continue in Guest Mode.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-100">
        {/* Glow header banner */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-6 pb-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-mono font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Institutional Access</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            Unlock QuantPulse Terminal
          </h2>
          <p className="text-sm text-blue-100 mt-1 max-w-md">
            Sign in with Google to enable cloud-persisted portfolio tracking, stochastic model storage, and institutional AI reasoning.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-6">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Value Highlights */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">
                  Multi-Engine Price Forecaster
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Monte Carlo GBM simulation (100+ paths) + ARIMA-LSTM neural sequence regression.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">
                  Paper Trading & Watchlist Persistence
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Execute virtual positions with $100,000 cash and sync your predictions to Firestore.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">
                  Secure Google Identity
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Single click authentication with no password hassle via Firebase Google Auth.
                </p>
              </div>
            </div>
          </div>

          {/* Google Sign-in Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 shadow-lg shadow-white/10 transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mb-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
          </button>

          {/* Guest Mode fallback */}
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium text-xs flex items-center justify-center gap-2 border border-slate-700/60 transition"
          >
            <span>Continue as Guest Trader</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <p className="text-[11px] text-center text-slate-500 mt-4">
            By signing in, your predictive models and watchlist are safely stored in your private Firebase instance.
          </p>
        </div>
      </div>
    </div>
  );
};
