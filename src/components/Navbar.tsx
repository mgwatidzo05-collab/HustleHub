import React, { useState } from 'react';
import {
  Menu,
  X,
  Store as StoreIcon,
  ShoppingBag,
  ShieldCheck,
  PlusCircle,
  User as UserIcon,
  LogOut,
  MapPin,
  ChevronDown,
  Bell,
  Sparkles,
  Lock,
  FileText,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenStoreSignup: () => void;
  onOpenStoreLogin: () => void;
  onOpenStoreDashboard: () => void;
  onOpenAdmin: () => void;
  onOpenNotifications: () => void;
  activeTab: 'marketplace' | 'stores';
  setActiveTab: (tab: 'marketplace' | 'stores') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenStoreSignup,
  onOpenStoreLogin,
  onOpenStoreDashboard,
  onOpenAdmin,
  onOpenNotifications,
  activeTab,
  setActiveTab,
}) => {
  const {
    currentUser,
    currentStore,
    isAdmin,
    logout,
    selectedUniversity,
    setSelectedUniversity,
    stores,
    openTerms,
    unreadNotificationsCount,
    unreadNewProductsCount,
  } = useMarketplace();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showUniDropdown, setShowUniDropdown] = useState(false);

  // Lock background scroll when slide-over menu is open
  useBodyScrollLock(menuOpen);

  const pendingStoresCount = stores.filter((s) => s.verificationStatus === 'pending').length;
  const pendingRequestsCount = stores.filter(
    (s) => s.featuredRequested || s.premiumRequested
  ).length;

  const universities = [
    { id: 'NUST', name: 'NUST (National Univ of Science & Tech)', status: 'Active Campus' },
    { id: 'UZ', name: 'UZ (University of Zimbabwe)', status: 'Coming Soon' },
    { id: 'MSU', name: 'MSU (Midlands State University)', status: 'Coming Soon' },
    { id: 'CUT', name: 'CUT (Chinhoyi Univ of Technology)', status: 'Coming Soon' },
  ];

  const handleNav = (tab: 'marketplace' | 'stores') => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <>
      {/* Top Navbar: HustleHub brand, Notification Bell, PWA button, and Menu button */}
      <header className="sticky top-0 z-40 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: HustleHub Brand & Logo */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('marketplace');
              }}
              className="flex items-center gap-2.5 group transition-transform active:scale-95"
            >
              <img
                src="/assets/aistudio/ss_b06f2828.PNG"
                alt="HustleHub Logo"
                className="w-9 h-9 rounded-xl object-contain shadow-md shadow-blue-500/20 group-hover:brightness-110 transition-all"
              />
              <span className="text-xl font-black tracking-tight text-white flex items-center">
                Hustle<span className="text-orange-500 ml-0.5">Hub</span>
              </span>
            </a>

            {/* Right: Notification Bell, Install App & Menu Button */}
            <div className="flex items-center gap-2">
              {/* Notification Bell with Realtime Badge Count */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm"
                aria-label="View notifications"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-orange-400" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] text-[10px] font-black rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              <PWAInstallButton variant="compact" />

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm"
                aria-label="Open Navigation Menu"
              >
                <span className="text-xs font-bold tracking-wide">Menu</span>
                {menuOpen ? (
                  <X className="w-4 h-4 text-orange-400" />
                ) : (
                  <Menu className="w-4 h-4 text-orange-400" />
                )}
                {(pendingStoresCount > 0 || pendingRequestsCount > 0 || unreadNotificationsCount > 0) && (
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-over Full Navigation Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl p-5 sm:p-6 overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top of drawer */}
            <div className="space-y-6">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/aistudio/ss_b06f2828.PNG"
                    alt="HustleHub"
                    className="w-8 h-8 rounded-lg object-contain"
                  />
                  <span className="text-lg font-black text-white">
                    Hustle<span className="text-orange-500">Hub</span>
                  </span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Campus Selector */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    <span>Campus Location:</span>
                  </span>
                  <button
                    onClick={() => setShowUniDropdown(!showUniDropdown)}
                    className="text-orange-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>{selectedUniversity}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {showUniDropdown && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    {universities.map((uni) => (
                      <button
                        key={uni.id}
                        onClick={() => {
                          setSelectedUniversity(uni.id);
                          setShowUniDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          selectedUniversity === uni.id
                            ? 'bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/30'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate pr-2">{uni.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {uni.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Links / Portals */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-1">
                  Main Marketplace Portals
                </div>

                {/* Marketplace Catalog */}
                <button
                  onClick={() => handleNav('marketplace')}
                  className={`w-full p-3 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-all ${
                    activeTab === 'marketplace'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-950/50 hover:bg-slate-800 text-slate-200 border border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className={`w-5 h-5 ${activeTab === 'marketplace' ? 'text-white' : 'text-orange-400'}`} />
                    <div>
                      <div>Marketplace Catalog</div>
                      <div className={`text-xs font-normal ${activeTab === 'marketplace' ? 'text-orange-100' : 'text-slate-400'}`}>
                        Buy, sell & trade textbooks & gear
                      </div>
                    </div>
                  </div>
                </button>

                {/* Student Stores Portal */}
                <button
                  onClick={() => handleNav('stores')}
                  className={`w-full p-3 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-all ${
                    activeTab === 'stores'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-950/50 hover:bg-slate-800 text-slate-200 border border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <StoreIcon className={`w-5 h-5 ${activeTab === 'stores' ? 'text-white' : 'text-blue-400'}`} />
                    <div>
                      <div>Student Stores Portal</div>
                      <div className={`text-xs font-normal ${activeTab === 'stores' ? 'text-orange-100' : 'text-slate-400'}`}>
                        Browse verified campus businesses
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-black/30 font-bold">
                    {stores.filter(s => s.isVerified && !s.isFrozen).length}
                  </span>
                </button>
              </div>

              {/* Student Business Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-1">
                  For Student Entrepreneurs
                </div>

                {currentStore ? (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenStoreDashboard();
                    }}
                    className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/40 text-left text-sm font-semibold flex items-center gap-3 text-amber-300 hover:brightness-110 transition-all cursor-pointer"
                  >
                    <StoreIcon className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>Manage {currentStore.name}</span>
                        {currentStore.isVerified && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <div className="text-xs font-normal text-amber-300/80">
                        Products, WhatsApp analytics & upgrades
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-2">
                    {/* Separate Sign In Button for Registered Businesses */}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenStoreLogin();
                      }}
                      className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left text-sm font-semibold flex items-center gap-3 text-white transition-all cursor-pointer shadow-sm"
                    >
                      <Lock className="w-5 h-5 text-orange-400" />
                      <div>
                        <div className="text-orange-300">Sign In to Your Store</div>
                        <div className="text-xs font-normal text-slate-400">
                          For registered businesses with password
                        </div>
                      </div>
                    </button>

                    {/* Register New Store */}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenStoreSignup();
                      }}
                      className="w-full p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800 text-left text-sm font-semibold flex items-center gap-3 text-slate-200 transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-5 h-5 text-slate-400" />
                      <div>
                        <div>Register a New Store</div>
                        <div className="text-xs font-normal text-slate-400">
                          Free student store signup
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Notifications Link */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenNotifications();
                  }}
                  className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:bg-slate-800 text-left text-sm font-semibold flex items-center justify-between text-slate-200 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-orange-400" />
                    <div>
                      <div>Notifications Center</div>
                      <div className="text-xs font-normal text-slate-400">
                        Live alerts & campus updates
                      </div>
                    </div>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500 text-white font-bold">
                      {unreadNotificationsCount} new
                    </span>
                  )}
                </button>
              </div>

              {/* Admin Portal Link */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className={`w-full p-3 rounded-xl text-left text-sm font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                    isAdmin
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <div>
                      <div>Admin Portal</div>
                      <div className="text-xs font-normal text-slate-400">
                        Verify stores, promotions & Appwrite
                      </div>
                    </div>
                  </div>
                  {(pendingStoresCount > 0 || pendingRequestsCount > 0) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-600 text-white font-bold">
                      {pendingStoresCount + pendingRequestsCount} alert{pendingStoresCount + pendingRequestsCount > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              </div>

              {/* Install HustleHub PWA */}
              <div className="pt-2">
                <PWAInstallButton variant="banner" onInstalled={() => setMenuOpen(false)} />
              </div>
            </div>

            {/* Bottom: User Sign In / Profile */}
            <div className="pt-6 border-t border-slate-800 space-y-3">
              {currentUser ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-orange-400 shrink-0">
                      {currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-orange-400" />
                    <span>Student Buyer Sign In</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenStoreLogin();
                    }}
                    className="w-full text-center text-[11px] text-orange-400 hover:underline py-1 cursor-pointer"
                  >
                    Store owner? Sign in with password →
                  </button>
                </div>
              )}

              <div className="pt-2 text-center border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    openTerms();
                  }}
                  className="text-[11px] text-slate-400 hover:text-orange-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-orange-400" />
                  <span>Terms & Conditions & Safety Policy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
