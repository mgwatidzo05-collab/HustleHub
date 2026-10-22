import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Store as StoreIcon,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStoreSignup: () => void;
  onOpenStoreLogin?: () => void;
  onOpenStoreDashboard?: () => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onOpenStoreSignup,
  onOpenStoreLogin,
  onOpenStoreDashboard,
}) => {
  useBodyScrollLock(isOpen);
  const { loginCustomer, openTerms } = useMarketplace();

  const [role, setRole] = useState<'customer' | 'business'>('customer');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return setError('Please enter a valid email address');
    }

    if (!agreedToTerms) {
      return setError('Please read and agree to the HustleHub Terms & Conditions to continue.');
    }

    loginCustomer(email.trim(), name.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/ss_b06f2828.PNG"
              alt="HustleHub"
              className="w-7 h-7 rounded-lg object-contain"
            />
            <h2 className="text-base font-bold text-white">
              Join Hustle<span className="text-orange-500">Hub</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Role selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                role === 'customer'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Student Buyer</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('business')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                role === 'business'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <StoreIcon className="w-3.5 h-3.5" />
              <span>Student Business</span>
            </button>
          </div>

          {role === 'business' ? (
            <div className="space-y-4 pt-1 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-xs text-orange-200 leading-relaxed">
                Registered student businesses sign in securely using their store email and password.
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStoreLogin?.();
                }}
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Sign In with Store Password</span>
              </button>

              <div className="pt-2 text-center border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStoreSignup();
                  }}
                  className="text-xs text-slate-300 hover:text-white hover:underline font-medium"
                >
                  Need to register a brand new student store? Register here →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="text-center text-xs text-slate-400">
                Sign in with any email to browse student deals, save favorites, and chat with sellers on WhatsApp.
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              {/* Email form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tariro or Muna"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address (Any email accepted)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. tariro@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Any active email address welcome — no specific campus domain required.
                  </p>
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
                        HustleHub Terms & Conditions
                      </button>{' '}
                      and Campus Safety Guidelines.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!agreedToTerms}
                  className="w-full py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  Continue as Student Buyer
                </button>

                <div className="text-center pt-1 text-[11px] text-slate-500">
                  By signing in, you agree to inspect goods in public campus areas before paying.
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer Link */}
        <div className="px-5 py-3 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Protected Campus Marketplace</span>
          <button
            type="button"
            onClick={openTerms}
            className="text-slate-400 hover:text-orange-400 hover:underline cursor-pointer"
          >
            Read Terms & Conditions →
          </button>
        </div>
      </div>
    </div>
  );
};
