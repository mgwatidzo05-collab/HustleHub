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
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenStoreSignup,
  onOpenStoreDashboard,
  onOpenAdmin,
  onOpenAuth,
}) => {
  const { currentStore, currentUser, isAdmin } = useMarketplace();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F17]/95 backdrop-blur-lg border-t border-slate-800 lg:hidden px-3 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around">
        
        {/* Marketplace */}
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            activeTab === 'marketplace' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
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

        {/* Admin Portal */}
        <button
          onClick={onOpenAdmin}
          className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            isAdmin ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] font-medium">Admin</span>
        </button>

        {/* Profile / Auth */}
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
      </div>
    </div>
  );
};
