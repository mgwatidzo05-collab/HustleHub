import React, { useState } from 'react';
import {
  X,
  Store as StoreIcon,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface BusinessLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStoreSignup: () => void;
  onOpenCustomerAuth: () => void;
  onSuccess: () => void;
}

export const BusinessLoginModal: React.FC<BusinessLoginModalProps> = ({
  isOpen,
  onClose,
  onOpenStoreSignup,
  onOpenCustomerAuth,
  onSuccess,
}) => {
  useBodyScrollLock(isOpen);
  const { loginBusinessWithPassword, openTerms } = useMarketplace();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return setError('Please enter your store email address or store name.');
    }

    if (!password) {
      return setError('Please enter your store password.');
    }

    if (!agreedToTerms) {
      return setError('Please review and check the box to agree to the HustleHub Business Terms & Conditions.');
    }

    setLoading(true);
    try {
      const res = await loginBusinessWithPassword(trimmedEmail, password);
      if (!res.success) {
        setError(res.error || 'Failed to sign in to store.');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[92dvh] sm:max-h-[90vh] shadow-2xl relative flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30 shrink-0">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>Business Owner Sign In</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Access your store products, analytics & WhatsApp leads
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-slate-300">
              Enter the email you registered your business with and your store password.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Registered Store Email
              </label>
              <input
                type="email"
                required
                autoFocus
                placeholder="e.g. yourname@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500 placeholder:text-slate-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Store Password</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-orange-400 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your store password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500 placeholder:text-slate-600 transition-colors"
                />
              </div>
            </div>

            {/* Terms and Conditions Agreement */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 accent-orange-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-300 leading-tight">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      openTerms();
                    }}
                    className="text-orange-400 hover:text-orange-300 font-semibold underline inline cursor-pointer"
                  >
                    Business Terms & Conditions
                  </button>{' '}
                  and Seller Code of Conduct.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/25 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Sign In to Store Dashboard'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          {/* Quick links */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2 text-center text-xs">
            <div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStoreSignup();
                }}
                className="text-orange-400 hover:text-orange-300 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Haven't registered your student store yet? Register here</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCustomerAuth();
                }}
                className="text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer"
              >
                Looking for student buyer sign in? Click here
              </button>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar - Fixed */}
        <div className="shrink-0 px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Verified Student Commerce</span>
          <button
            type="button"
            onClick={openTerms}
            className="text-slate-400 hover:text-orange-400 hover:underline cursor-pointer"
          >
            Terms & Conditions →
          </button>
        </div>
      </div>
    </div>
  );
};
