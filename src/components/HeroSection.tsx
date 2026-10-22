import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  Store,
  MessageCircle,
  ShieldCheck,
  Zap,
  Lock,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

interface HeroSectionProps {
  onOpenStoreSignup: () => void;
  onOpenStoreLogin: () => void;
  onOpenStoreDashboard: () => void;
  onExplore: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenStoreSignup,
  onOpenStoreLogin,
  onOpenStoreDashboard,
  onExplore,
}) => {
  const { stores, products, totalWhatsAppClicks, selectedUniversity, currentStore } = useMarketplace();
  const verifiedStoresCount = stores.filter(s => s.isVerified && !s.isFrozen).length;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-[#0A0D14] border border-slate-800/80 p-6 sm:p-8 my-4">
      {/* Subtle background glow matching brand colors */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        {/* Campus indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300 mb-4">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span>Live at {selectedUniversity} Campus</span>
          <span className="text-slate-500">·</span>
          <span className="text-orange-400">Student-to-Student Only</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight sm:leading-none mb-3">
          The Campus Market For <br className="hidden sm:inline" />
          Student <span className="text-orange-500">Hustlers</span> & Essentials.
        </h1>

        <p className="text-sm sm:text-base text-slate-300 mb-6 max-w-2xl leading-relaxed">
          Buy, sell, and trade textbooks, electronics, and dorm gear. Hire fellow student barbers, nail techs, laundry services, and thesis printers with instant WhatsApp direct messaging.
        </p>

        {/* Action Buttons: Explore, Register Store, and Sign In to Your Store */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={onExplore}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Market</span>
          </button>

          <button
            onClick={onOpenStoreSignup}
            className="px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-white font-medium text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Store className="w-4 h-4 text-orange-400" />
            <span>Register Your Store</span>
          </button>

          {currentStore ? (
            <button
              onClick={onOpenStoreDashboard}
              className="px-5 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/40 text-white font-medium text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-900/30"
            >
              <Store className="w-4 h-4 text-emerald-200" />
              <span>Manage {currentStore.name}</span>
            </button>
          ) : (
            <button
              onClick={onOpenStoreLogin}
              className="px-5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-orange-300 hover:text-white font-medium text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Sign in to your registered store with password"
            >
              <Lock className="w-4 h-4 text-orange-400" />
              <span>Sign In to Your Store</span>
            </button>
          )}
        </div>

        {/* Quiet Meta Stats - No AI Slop Pill Boxes */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200 font-semibold">{verifiedStoresCount}</span>
            <span>Verified Stores</span>
          </div>
          <span className="hidden sm:inline text-slate-600">/</span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-slate-200 font-semibold">{products.length}</span>
            <span>Live Products & Services</span>
          </div>
          <span className="hidden sm:inline text-slate-600">/</span>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200 font-semibold">{totalWhatsAppClicks}</span>
            <span>Direct WhatsApp Inquiries</span>
          </div>
        </div>
      </div>
    </div>
  );
};
