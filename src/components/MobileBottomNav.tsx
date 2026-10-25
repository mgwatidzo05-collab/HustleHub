import React from 'react';
import {
  ShoppingBag,
  Store as StoreIcon,
  PlusCircle,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

interface MobileBottomNavProps {
  activeTab: 'marketplace' | 'stores';
  setActiveTab: (tab: 'marketplace' | 'stores') => void;
  onOpenStoreSignup: () => void;
  onOpenStoreDashboard: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenStoreSignup,
  onOpenStoreDashboard,
  onOpenAdmin,
  onOpenAuth,
  onOpenNotifications,
}) => {
  const { currentStore, currentUser, isAdmin, unreadNotificationsCount, unreadNewProductsCount } = useMarketplace();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F17]/95 backdrop-blur-lg border-t border-slate-800 lg:hidden px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around">
        
        {/* Marketplace */}
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`relative flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            activeTab === 'marketplace' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {unreadNewProductsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 min-w-[14px] h-3.5 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadNewProductsCount > 9 ? '9+' : unreadNewProductsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Market</span>
        </button>

        {/* Stores */}
        <button
          onClick={() => setActiveTab('stores')}
          className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            activeTab === 'stores' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <StoreIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium">Stores</span>
        </button>

        {/* Sell / My Store */}
        <button
          onClick={currentStore ? onOpenStoreDashboard : onOpenStoreSignup}
          className="flex flex-col items-center gap-1 py-1 px-2 text-orange-400 active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30">
            {currentStore ? <StoreIcon className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          </div>
          <span className="text-[10px] font-bold text-orange-400">
            {currentStore ? 'My Store' : 'Sell'}
          </span>
        </button>

        {/* Live Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative flex flex-col items-center gap-1 py-1 px-2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <div className="relative">
            <div className="w-5 h-5 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 min-w-[14px] h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Alerts</span>
        </button>

        {/* Admin or Profile */}
        {isAdmin ? (
          <button
            onClick={onOpenAdmin}
            className="flex flex-col items-center gap-1 py-1 px-2 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-medium">Admin</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
              currentUser ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium truncate max-w-[50px]">
              {currentUser ? currentUser.name.split(' ')[0] : 'Sign In'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
