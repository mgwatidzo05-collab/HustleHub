import React, { useState, useEffect } from 'react';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturedStoresSection } from './components/FeaturedStoresSection';
import { ProductCard } from './components/ProductCard';
import { StoreCard } from './components/StoreCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { StoreDetailModal } from './components/StoreDetailModal';
import { BusinessSignupModal } from './components/BusinessSignupModal';
import { BusinessLoginModal } from './components/BusinessLoginModal';
import { BusinessDashboardModal } from './components/BusinessDashboardModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { ReportModal } from './components/ReportModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { TermsModal } from './components/TermsModal';
import { Product, Store, StoreCategory } from './types';
import {
  ShoppingBag,
  Store as StoreIcon,
  ShieldCheck,
  Search,
  Sparkles,
  MessageCircle,
  Truck,
  CheckCircle2,
  ArrowLeftRight,
  BookOpen,
  Laptop,
  Home,
  Scissors,
  Printer,
  Shirt,
  GraduationCap,
  Wrench,
  Layers,
  MapPin,
  PlusCircle,
  RotateCcw,
  FileText,
} from 'lucide-react';

const MarketplaceApp: React.FC = () => {
  const {
    stores,
    products,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filterVerifiedOnly,
    setFilterVerifiedOnly,
    filterDeliversOnly,
    setFilterDeliversOnly,
    filterTradesOnly,
    setFilterTradesOnly,
    filterFeaturedOnly,
    setFilterFeaturedOnly,
    selectedUniversity,
    currentStore,
    isTermsOpen,
    openTerms,
    closeTerms,
  } = useMarketplace();

  // Helpers to read initial navigation and modal state from URL or localStorage
  const getStoredParam = (key: string): string | null => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlVal = urlParams.get(key);
      if (urlVal) return urlVal;
      return localStorage.getItem(`hustlehub_nav_${key}`);
    } catch {
      return null;
    }
  };

  const syncUrlAndStorage = (key: string, val: string | null) => {
    try {
      const url = new URL(window.location.href);
      if (val) {
        localStorage.setItem(`hustlehub_nav_${key}`, val);
        url.searchParams.set(key, val);
      } else {
        localStorage.removeItem(`hustlehub_nav_${key}`);
        url.searchParams.delete(key);
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore in restricted environments
    }
  };

  // Navigation & View State (persists on refresh)
  const [activeTab, setActiveTabState] = useState<'marketplace' | 'stores'>(() => {
    const saved = getStoredParam('tab');
    return saved === 'stores' ? 'stores' : 'marketplace';
  });

  const setActiveTab = (tab: 'marketplace' | 'stores') => {
    setActiveTabState(tab);
    syncUrlAndStorage('tab', tab);
  };

  // Dedicated Stores Search within the Student Stores Portal
  const [storeSearch, setStoreSearch] = useState('');
  const [storeCategoryFilter, setStoreCategoryFilter] = useState<StoreCategory | 'all'>('all');

  // Modals with refresh persistence
  const [selectedProductId, setSelectedProductId] = useState<string | null>(() => getStoredParam('product'));
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(() => getStoredParam('store'));
  const [activeModal, setActiveModal] = useState<string | null>(() => getStoredParam('modal'));

  const [selectedProduct, setSelectedProductState] = useState<Product | null>(null);
  const [selectedStore, setSelectedStoreState] = useState<Store | null>(null);

  const [isAuthOpen, setIsAuthOpenState] = useState(() => activeModal === 'auth');
  const [isStoreSignupOpen, setIsStoreSignupOpenState] = useState(() => activeModal === 'signup');
  const [isStoreLoginOpen, setIsStoreLoginOpenState] = useState(() => activeModal === 'login');
  const [isStoreDashboardOpen, setIsStoreDashboardOpenState] = useState(() => activeModal === 'dashboard');
  const [isAdminOpen, setIsAdminOpenState] = useState(() => activeModal === 'admin');

  // Modal setters that sync with URL and storage
  const setIsAuthOpen = (open: boolean) => {
    setIsAuthOpenState(open);
    syncUrlAndStorage('modal', open ? 'auth' : null);
  };

  const setIsStoreSignupOpen = (open: boolean) => {
    setIsStoreSignupOpenState(open);
    syncUrlAndStorage('modal', open ? 'signup' : null);
  };

  const setIsStoreLoginOpen = (open: boolean) => {
    setIsStoreLoginOpenState(open);
    syncUrlAndStorage('modal', open ? 'login' : null);
  };

  const setIsStoreDashboardOpen = (open: boolean) => {
    setIsStoreDashboardOpenState(open);
    syncUrlAndStorage('modal', open ? 'dashboard' : null);
  };

  const setIsAdminOpen = (open: boolean) => {
    setIsAdminOpenState(open);
    syncUrlAndStorage('modal', open ? 'admin' : null);
  };

  const setSelectedProduct = (prod: Product | null) => {
    setSelectedProductState(prod);
    setSelectedProductId(prod?.id || null);
    syncUrlAndStorage('product', prod?.id || null);
  };

  const setSelectedStore = (store: Store | null) => {
    setSelectedStoreState(store);
    setSelectedStoreId(store?.id || null);
    syncUrlAndStorage('store', store?.id || null);
  };

  // Re-attach selected product/store if restored from refresh or when data loads
  useEffect(() => {
    if (selectedProductId && !selectedProduct && products.length > 0) {
      const found = products.find(p => p.id === selectedProductId);
      if (found) setSelectedProductState(found);
    }
  }, [selectedProductId, selectedProduct, products]);

  useEffect(() => {
    if (selectedStoreId && !selectedStore && stores.length > 0) {
      const found = stores.find(s => s.id === selectedStoreId);
      if (found) setSelectedStoreState(found);
    }
  }, [selectedStoreId, selectedStore, stores]);

  const [reportTarget, setReportTarget] = useState<{
    targetType: 'product' | 'store';
    targetId: string;
    targetTitle: string;
  } | null>(null);

  // Categories list
  const catalogCategories: { id: StoreCategory | 'all'; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: 'All Catalog', icon: Layers },
    { id: 'textbooks', label: 'Textbooks', icon: BookOpen },
    { id: 'electronics', label: 'Electronics', icon: Laptop },
    { id: 'dorm', label: 'Dorm Gear', icon: Home },
    { id: 'barber', label: 'Barber & Fades', icon: Scissors },
    { id: 'nail_tech', label: 'Nails & Beauty', icon: Sparkles },
    { id: 'printing', label: 'Printing & Binding', icon: Printer },
    { id: 'laundry', label: 'Laundry Service', icon: Shirt },
    { id: 'tutoring', label: 'Tutoring', icon: GraduationCap },
    { id: 'repairs', label: 'Tech Repairs', icon: Wrench },
  ];

  // Filter Products: Show all live products from non-frozen stores
  const filteredProducts = products.filter((prod) => {
    const parentStore = stores.find((s) => s.id === prod.storeId);
    
    // Only hide product if the parent store is explicitly frozen by admin
    if (parentStore && parentStore.isFrozen) {
      return false;
    }

    if (selectedCategory !== 'all' && prod.category !== selectedCategory) {
      return false;
    }

    if (filterVerifiedOnly && !prod.storeIsVerified) {
      return false;
    }

    if (filterDeliversOnly && (!parentStore || !parentStore.delivers)) {
      return false;
    }

    if (filterTradesOnly && !prod.isTradeable) {
      return false;
    }

    if (filterFeaturedOnly && (!parentStore || !parentStore.isFeatured)) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = prod.title.toLowerCase().includes(q);
      const matchDesc = prod.description.toLowerCase().includes(q);
      const matchStore = prod.storeName.toLowerCase().includes(q);
      const matchCategory = prod.category.toLowerCase().includes(q);
      const matchLocation = prod.storeLocation.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchStore || matchCategory || matchLocation;
    }

    return true;
  });

  // Filter Stores for the Student Stores Portal:
  // Shows all active non-frozen student businesses
  const filteredStores = stores.filter((store) => {
    const isOwner = currentStore?.id === store.id;

    // Hide frozen stores from the public
    if (!isOwner && store.isFrozen) {
      return false;
    }

    // Category filter in store portal
    if (storeCategoryFilter !== 'all' && store.category !== storeCategoryFilter) {
      return false;
    }

    if (filterVerifiedOnly && !store.isVerified) {
      return false;
    }

    if (filterDeliversOnly && !store.delivers) {
      return false;
    }

    if (filterFeaturedOnly && !store.isFeatured) {
      return false;
    }

    // Search query in store portal
    if (storeSearch.trim()) {
      const q = storeSearch.toLowerCase();
      const matchName = store.name.toLowerCase().includes(q);
      const matchDesc = store.description.toLowerCase().includes(q);
      const matchTagline = store.tagline.toLowerCase().includes(q);
      const matchLocation = store.location.toLowerCase().includes(q);
      const matchOwner = store.ownerName.toLowerCase().includes(q);
      const matchCategory = store.category.toLowerCase().includes(q);
      return matchName || matchDesc || matchTagline || matchLocation || matchOwner || matchCategory;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col font-sans pb-16 lg:pb-0">
      
      {/* Top Navbar: ONLY HustleHub Brand & Menu Button */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenStoreSignup={() => setIsStoreSignupOpen(true)}
        onOpenStoreLogin={() => setIsStoreLoginOpen(true)}
        onOpenStoreDashboard={() => setIsStoreDashboardOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        
        {/* ========================================================================= */}
        {/* VIEW 1: MARKETPLACE CATALOG (Buy, Sell & Trade)                            */}
        {/* ========================================================================= */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            {/* Hero Section */}
            <HeroSection
              onOpenStoreSignup={() => setIsStoreSignupOpen(true)}
              onOpenStoreLogin={() => setIsStoreLoginOpen(true)}
              onOpenStoreDashboard={() => setIsStoreDashboardOpen(true)}
              onExplore={() => {
                const el = document.getElementById('marketplace-catalog');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Featured Student Businesses Carousel Spotlight */}
            <FeaturedStoresSection
              onSelectStore={(st) => setSelectedStore(st)}
              onOpenStoreSignup={() => setIsStoreSignupOpen(true)}
            />

            {/* Marketplace Catalog Section */}
            <section id="marketplace-catalog" className="space-y-4 pt-2">
              
              {/* Header with Search Bar right in the Marketplace */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-orange-500" />
                      <span>Marketplace Listings & Services</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Buy directly from student peers at {selectedUniversity} with WhatsApp contact
                    </p>
                  </div>

                  {/* Switch to Stores Portal shortcut */}
                  <button
                    onClick={() => setActiveTab('stores')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    <StoreIcon className="w-4 h-4 text-blue-400" />
                    <span>View Student Stores ({stores.filter(s => s.isVerified).length})</span>
                  </button>
                </div>

                {/* Search Bar in Marketplace */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search textbooks, electronics, calculators, room kettles, services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 text-sm text-slate-100 pl-10 pr-10 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500 placeholder:text-slate-500 shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Scroller & Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
                  {catalogCategories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                          isActive
                            ? 'bg-slate-800 text-orange-400 border-orange-500/50 shadow-sm'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Filter Toggles Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => setFilterFeaturedOnly(!filterFeaturedOnly)}
                    className={`px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      filterFeaturedOnly
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Featured Items</span>
                  </button>

                  <button
                    onClick={() => setFilterVerifiedOnly(!filterVerifiedOnly)}
                    className={`px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      filterVerifiedOnly
                        ? 'bg-blue-500/15 border-blue-500/50 text-blue-400'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Stores</span>
                  </button>

                  <button
                    onClick={() => setFilterDeliversOnly(!filterDeliversOnly)}
                    className={`px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      filterDeliversOnly
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Campus Delivery</span>
                  </button>

                  <button
                    onClick={() => setFilterTradesOnly(!filterTradesOnly)}
                    className={`px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      filterTradesOnly
                        ? 'bg-orange-500/15 border-orange-500/50 text-orange-400'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Trades & Swaps</span>
                  </button>

                  {(searchQuery || selectedCategory !== 'all' || filterVerifiedOnly || filterDeliversOnly || filterTradesOnly || filterFeaturedOnly) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setFilterVerifiedOnly(false);
                        setFilterDeliversOnly(false);
                        setFilterTradesOnly(false);
                        setFilterFeaturedOnly(false);
                      }}
                      className="ml-auto text-xs text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                products.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-dashed border-orange-500/20 p-8 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 mx-auto flex items-center justify-center">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h3 className="text-base font-bold text-white">The Marketplace is Ready for Listings!</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Be the first student to list textbooks, electronics, dorm essentials, or campus services on HustleHub.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setIsStoreSignupOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
                      >
                        Register Your Student Business
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                      <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">No listings match your search</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Try searching for different keywords or clear your active category filters.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setFilterTradesOnly(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium transition-colors cursor-pointer"
                    >
                      Clear Search Filters
                    </button>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filteredProducts.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onSelectProduct={(p) => setSelectedProduct(p)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: STUDENT STORES PORTAL (Verified Campus Businesses & Services)    */}
        {/* ========================================================================= */}
        {activeTab === 'stores' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            {/* Student Stores Portal Header & Search Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[11px] font-semibold text-blue-400 mb-1">
                    <StoreIcon className="w-3.5 h-3.5" />
                    <span>Campus Student Business Directory</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Student Stores & Services Portal
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Discover barbers, nail techs, laundry services, 24/7 printing and tech gurus operated 100% by {selectedUniversity} students.
                  </p>
                </div>

                {/* Register Store CTA */}
                <button
                  onClick={() => setIsStoreSignupOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register Your Store</span>
                </button>
              </div>

              {/* SEARCH BAR PLACED IN THE STUDENTS STORES PORTAL (User request!) */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search student stores by name, service (e.g. Barber, Laundry, Printing), or campus spot..."
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  className="w-full bg-slate-950 text-sm text-slate-100 pl-10 pr-10 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500 placeholder:text-slate-500 shadow-inner"
                />
                {storeSearch && (
                  <button
                    onClick={() => setStoreSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Scroller for Stores */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
                {catalogCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = storeCategoryFilter === cat.id;
                  const count = cat.id === 'all'
                    ? stores.filter(s => s.isVerified && !s.isFrozen).length
                    : stores.filter(s => s.category === cat.id && s.isVerified && !s.isFrozen).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setStoreCategoryFilter(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 text-orange-400 border-orange-500/50 shadow-sm'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                      <span>{cat.label}</span>
                      {count > 0 && (
                        <span className="text-[10px] px-1 rounded bg-black/40 text-slate-400">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Store Filter Controls & Stats */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setFilterFeaturedOnly(!filterFeaturedOnly)}
                    className={`px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      filterFeaturedOnly
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Featured Spotlight</span>
                  </button>

                  <button
                    onClick={() => setFilterDeliversOnly(!filterDeliversOnly)}
                    className={`px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      filterDeliversOnly
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Offers Campus Delivery</span>
                  </button>
                </div>

                <div className="text-slate-400 text-xs">
                  Showing <strong className="text-white font-semibold">{filteredStores.length}</strong> student businesses
                </div>
              </div>
            </div>

            {/* Stores Grid */}
            {filteredStores.length === 0 ? (
              stores.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-dashed border-orange-500/20 p-8 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 mx-auto flex items-center justify-center">
                    <StoreIcon className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h3 className="text-base font-bold text-white">No Student Stores Registered Yet</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Are you a student barber, nail tech, laundry runner, printer, tutor, or reseller? Register your store today to be featured on campus!
                    </p>
                  </div>
                  <button
                    onClick={() => setIsStoreSignupOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs text-white font-bold transition-all shadow-lg shadow-orange-500/25 cursor-pointer"
                  >
                    Register Your Business
                  </button>
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                    <StoreIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">No student businesses match this filter</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try clearing your search query or reset the category to explore all active stores.
                  </p>
                  <button
                    onClick={() => {
                      setStoreSearch('');
                      setStoreCategoryFilter('all');
                      setFilterDeliversOnly(false);
                      setFilterFeaturedOnly(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs text-white font-bold transition-colors cursor-pointer"
                  >
                    Show All Verified Stores
                  </button>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStores.map((store) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    onSelectStore={(st) => setSelectedStore(st)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Safety & Guidelines Banner */}
        <section className="mt-12 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-0.5">Direct WhatsApp Chats</h4>
              <p className="text-slate-400 leading-relaxed">
                Connect directly with the student seller. No middlemen, no commissions, no delayed responses.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-0.5">Safe Campus Meetups</h4>
              <p className="text-slate-400 leading-relaxed">
                Meet in open campus areas: Library Quad, Hall Foyers, or Student Union Complex during daylight hours.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-0.5">Peer Support & Hustle</h4>
              <p className="text-slate-400 leading-relaxed">
                Support fellow student businesses at NUST. Free registration for all student hustlers.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800/80 bg-[#080B11] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/aistudio/ss_b06f2828.PNG"
                alt="HustleHub"
                className="w-6 h-6 rounded-md object-contain"
              />
              <span className="font-black text-white">
                Hustle<span className="text-orange-500">Hub</span>
              </span>
              <span className="text-slate-600">·</span>
              <span>Dedicated Marketplace for NUST Students</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              <button
                onClick={openTerms}
                className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Terms & Conditions</span>
              </button>
              <span>·</span>
              <button
                onClick={() => setIsAdminOpen(true)}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Admin Portal
              </button>
              <span>·</span>
              <button
                onClick={() => setIsStoreSignupOpen(true)}
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Register Store
              </button>
              <span>·</span>
              <button
                onClick={() => setIsStoreLoginOpen(true)}
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Store Sign In
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <div>
              By using HustleHub, student buyers and businesses agree to our{' '}
              <button
                onClick={openTerms}
                className="text-slate-400 hover:text-orange-400 underline cursor-pointer"
              >
                Terms & Conditions, Seller Code of Conduct & Campus Safety Policy
              </button>.
            </div>
            <div>
              &copy; {new Date().getFullYear()} HustleHub. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Native Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t)}
        onOpenStoreSignup={() => setIsStoreSignupOpen(true)}
        onOpenStoreDashboard={() => setIsStoreDashboardOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* MODALS WITH SCROLL LOCK */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSelectStore={(st) => setSelectedStore(st)}
          onOpenReport={(type, id, title) =>
            setReportTarget({ targetType: type, targetId: id, targetTitle: title })
          }
        />
      )}

      {selectedStore && (
        <StoreDetailModal
          store={selectedStore}
          onClose={() => setSelectedStore(null)}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onOpenStoreDashboard={() => setIsStoreDashboardOpen(true)}
          onOpenReport={(type, id, title) =>
            setReportTarget({ targetType: type, targetId: id, targetTitle: title })
          }
        />
      )}

      {isStoreSignupOpen && (
        <BusinessSignupModal
          isOpen={isStoreSignupOpen}
          onClose={() => setIsStoreSignupOpen(false)}
          onOpenStoreLogin={() => {
            setIsStoreSignupOpen(false);
            setIsStoreLoginOpen(true);
          }}
          onSuccess={() => {
            setIsStoreSignupOpen(false);
            setIsStoreDashboardOpen(true);
          }}
        />
      )}

      {isStoreLoginOpen && (
        <BusinessLoginModal
          isOpen={isStoreLoginOpen}
          onClose={() => setIsStoreLoginOpen(false)}
          onOpenStoreSignup={() => {
            setIsStoreLoginOpen(false);
            setIsStoreSignupOpen(true);
          }}
          onOpenCustomerAuth={() => {
            setIsStoreLoginOpen(false);
            setIsAuthOpen(true);
          }}
          onSuccess={() => {
            setIsStoreLoginOpen(false);
            setIsStoreDashboardOpen(true);
          }}
        />
      )}

      {isStoreDashboardOpen && (
        <BusinessDashboardModal
          isOpen={isStoreDashboardOpen}
          onClose={() => setIsStoreDashboardOpen(false)}
          onOpenStorePreview={(st) => setSelectedStore(st)}
        />
      )}

      {isAdminOpen && (
        <AdminPortalModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          onSelectProduct={(p) => setSelectedProduct(p)}
        />
      )}

      {isAuthOpen && (
        <CustomerAuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onOpenStoreSignup={() => {
            setIsAuthOpen(false);
            setIsStoreSignupOpen(true);
          }}
          onOpenStoreLogin={() => {
            setIsAuthOpen(false);
            setIsStoreLoginOpen(true);
          }}
          onOpenStoreDashboard={() => setIsStoreDashboardOpen(true)}
        />
      )}

      {reportTarget && (
        <ReportModal
          isOpen={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          targetTitle={reportTarget.targetTitle}
        />
      )}

      {/* Global Terms and Conditions Modal */}
      <TermsModal
        isOpen={isTermsOpen}
        onClose={closeTerms}
      />
    </div>
  );
};

export default function App() {
  return (
    <MarketplaceProvider>
      <MarketplaceApp />
    </MarketplaceProvider>
  );
}
