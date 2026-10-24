import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Trash2,
  TrendingUp,
  MessageCircle,
  Eye,
  Sparkles,
  Layers,
  Flag,
  Server,
  Store as StoreIcon,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Copy,
  Check,
  Database,
  FolderLock,
  Key,
  Search,
  MapPin,
  Truck,
} from 'lucide-react';
import { Store, Product, ReportedContent } from '../types';
import { useMarketplace } from '../context/MarketplaceContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  // Lock background scroll when Admin Portal is open
  useBodyScrollLock(isOpen);

  const {
    isAdmin,
    loginAsAdmin,
    logoutAdmin,
    stores,
    products,
    reports,
    analyticsEvents,
    verifyStore,
    rejectStore,
    freezeStore,
    unfreezeStore,
    deleteStore,
    deleteProduct,
    syncProductToCloud,
    syncAllLocalProductsToCloud,
    approveFeaturedPromotion,
    rejectFeaturedPromotion,
    revokeFeaturedPromotion,
    approvePremiumTier,
    rejectPremiumTier,
    revokePremiumTier,
    updateReportStatus,
    totalWhatsAppClicks,
    totalRevenue,
    appwriteConfig,
    updateAppwriteConfig,
    testAppwrite,
    isAppwriteLive,
    openTerms,
  } = useMarketplace();

  // Authentication State
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Admin Navigation Tabs - Dedicated Store Verification Requests section
  const [activeTab, setActiveTab] = useState<'verifications' | 'stores' | 'promotions' | 'analytics' | 'products' | 'reports' | 'appwrite'>('verifications');
  const [storeFilter, setStoreFilter] = useState<'all' | 'pending' | 'verified' | 'unverified' | 'featured' | 'premium' | 'frozen'>('pending');
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [verificationSearch, setVerificationSearch] = useState('');
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Appwrite Config Form State
  const [appwriteEndpoint, setAppwriteEndpoint] = useState(appwriteConfig.endpoint);
  const [appwriteProjectId, setAppwriteProjectId] = useState(appwriteConfig.projectId);
  const [appwriteDatabaseId, setAppwriteDatabaseId] = useState(appwriteConfig.databaseId);
  const [appwriteBucketId, setAppwriteBucketId] = useState(appwriteConfig.bucketId);
  const [appwriteStoresCollId, setAppwriteStoresCollId] = useState(appwriteConfig.storesCollectionId || 'stores');
  const [appwriteProductsCollId, setAppwriteProductsCollId] = useState(appwriteConfig.productsCollectionId || 'products');
  const [appwriteReportsCollId, setAppwriteReportsCollId] = useState(appwriteConfig.reportsCollectionId || 'reports');
  const [appwriteEventsCollId, setAppwriteEventsCollId] = useState(appwriteConfig.eventsCollectionId || 'analytics_events');
  const [showAdvancedCollections, setShowAdvancedCollections] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const success = loginAsAdmin(passwordInput);
    if (!success) {
      setAuthError('Access denied. Invalid credentials.');
    } else {
      setPasswordInput('');
    }
  };

  const handleTestAppwrite = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testAppwrite(appwriteEndpoint, appwriteProjectId);
      setTestResult(res);
      if (res.success) {
        updateAppwriteConfig({
          endpoint: appwriteEndpoint,
          projectId: appwriteProjectId,
          databaseId: appwriteDatabaseId,
          bucketId: appwriteBucketId,
          storesCollectionId: appwriteStoresCollId,
          productsCollectionId: appwriteProductsCollId,
          reportsCollectionId: appwriteReportsCollId,
          eventsCollectionId: appwriteEventsCollId,
          isConfigured: true,
        });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e?.message || 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const pendingStores = stores.filter((s) => !s.isVerified && (s.verificationStatus === 'pending' || s.verificationRequested));
  const verifiedStores = stores.filter((s) => Boolean(s.isVerified));
  const unverifiedStores = stores.filter((s) => !s.isVerified && s.verificationStatus !== 'pending' && !s.verificationRequested);
  const featuredStores = stores.filter((s) => s.isFeatured);
  const premiumStores = stores.filter((s) => s.hasPremiumLimit);
  const frozenStores = stores.filter((s) => s.isFrozen);

  // Paid Promotion & Upgrade Requests ($2 Featured & $1 Premium)
  const requestedFeaturedStores = stores.filter((s) => s.featuredRequested && !s.isFeatured);
  const requestedPremiumStores = stores.filter((s) => s.premiumRequested && !s.hasPremiumLimit);
  const totalPromotionRequests = requestedFeaturedStores.length + requestedPremiumStores.length;

  // Filtered stores for list
  const getFilteredStores = () => {
    switch (storeFilter) {
      case 'pending':
        return pendingStores;
      case 'verified':
        return verifiedStores;
      case 'unverified':
        return unverifiedStores;
      case 'featured':
        return featuredStores;
      case 'premium':
        return premiumStores;
      case 'frozen':
        return frozenStores;
      default:
        return stores;
    }
  };

  const displayedStores = getFilteredStores();

  const handleCopySchema = () => {
    const schemaDetails = {
      databaseId: 'hustlehub_db',
      bucketId: 'hustlehub_assets',
      collections: {
        stores: [
          'name (string, 255)',
          'tagline (string, 255)',
          'description (string, 1000)',
          'category (string, 50)',
          'university (string, 50)',
          'location (string, 255)',
          'delivers (boolean)',
          'deliveryNotes (string, 255)',
          'whatsappNumber (string, 50)',
          'whatsappClicks (integer)',
          'profileViews (integer)',
          'isVerified (boolean)',
          'verificationStatus (string, 20)',
          'isFrozen (boolean)',
          'freezeReason (string, 255)',
          'isFeatured (boolean)',
          'hasPremiumLimit (boolean)',
          'featuredRequested (boolean)',
          'premiumRequested (boolean)',
          'verificationRequested (boolean)',
          'verificationRequestDate (string, 50)',
          'logoUrl (string, 1000)',
          'bannerUrl (string, 1000)',
          'ownerId (string, 100)',
          'ownerName (string, 100)',
          'ownerEmail (string, 100)',
          'rating (float)',
          'reviewCount (integer)',
        ],
        products: [
          'storeId or storeid (string, 100)',
          'storeName or storename (string, 100)',
          'storewhatsapp or storeWhatsApp (string, 50)',
          'storeLocation or storelocation (string, 255)',
          'storeIsVerified or storeisverified (boolean)',
          'title (string, 255)',
          'description (string, 2000)',
          'price (float)',
          'currency (string, 10)',
          'category (string, 50)',
          'isService (boolean)',
          'condition (string, 50)',
          'isTradeable (boolean)',
          'tradePreference (string, 255)',
          'images (string[], array)',
          'inStock (boolean)',
          'views (integer)',
          'whatsappInquiries (integer)',
        ],
        reports: [
          'targetType (string, 20)',
          'targetId (string, 100)',
          'targetTitle (string, 255)',
          'storeName (string, 100)',
          'reason (string, 50)',
          'details (string, 1000)',
          'reporterEmail (string, 100)',
          'status (string, 20)',
        ],
        analytics_events: [
          'type (string, 50)',
          'storeId (string, 100)',
          'storeName (string, 100)',
          'productId (string, 100)',
          'productTitle (string, 255)',
          'timestamp (string, 50)',
          'amount (float)',
        ],
      },
    };

    navigator.clipboard?.writeText(JSON.stringify(schemaDetails, null, 2));
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  HustleHub Admin Portal
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Campus Supervisor
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Store verification, promotions activation & Appwrite setup
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={logoutAdmin}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Sign Out Admin
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LOGIN SCREEN IF NOT AUTHENTICATED */}
        {!isAdmin ? (
          <div className="p-8 sm:p-12 max-w-md mx-auto w-full my-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-orange-400 shadow-xl">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-1.5">
                Admin Authentication
              </h3>
              <p className="text-xs text-slate-400">
                Enter your administrative master password to manage HustleHub student businesses.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  required
                  placeholder="Master Password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 text-sm text-slate-100 px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500 text-center tracking-wider"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all active:scale-[0.99] cursor-pointer"
              >
                Authorize & Access Dashboard
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Top Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setActiveTab('verifications')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors relative cursor-pointer ${
                  activeTab === 'verifications'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Store Verification Requests</span>
                {pendingStores.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-bold animate-pulse">
                    {pendingStores.length} new
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('stores')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors relative cursor-pointer ${
                  activeTab === 'stores'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <StoreIcon className="w-3.5 h-3.5" />
                <span>All Stores ({stores.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('promotions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors relative cursor-pointer ${
                  activeTab === 'promotions'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Promotions & Upgrades</span>
                {totalPromotionRequests > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-bold">
                    {totalPromotionRequests} new
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Sales & Traffic Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>All Products ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Reports ({reports.filter(r => r.status === 'pending').length})</span>
              </button>

              <button
                onClick={() => setActiveTab('appwrite')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'appwrite'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Appwrite Database Guide</span>
              </button>
            </div>

            {/* DEDICATED SECTION: STORE VERIFICATION REQUESTS */}
            {activeTab === 'verifications' && (
              <div className="space-y-6">
                {/* Section Hero Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/10">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">
                          Store Verification Requests
                        </h3>
                        {pendingStores.length > 0 ? (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-bold animate-pulse">
                            {pendingStores.length} Pending Review
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                            0 Pending
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        Every newly registered student business requires supervisor review to grant the official Campus Verification Tick (Blue Badge). Review campus locations, phone numbers, and listed goods to keep the student marketplace safe.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0 self-start sm:self-auto">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Total Verified: <strong className="text-white">{verifiedStores.length}</strong> stores</span>
                  </div>
                </div>

                {/* Search / Filter for Requests if there are multiple */}
                {pendingStores.length > 1 && (
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search pending store requests by name, owner, or hostel..."
                      value={verificationSearch}
                      onChange={(e) => setVerificationSearch(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-slate-100 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Section A: Pending Stores List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Stores Awaiting Verification Approval ({pendingStores.length})</span>
                    </h4>
                  </div>

                  {pendingStores.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-400 space-y-2">
                      <CheckCircle2 className="w-9 h-9 text-emerald-400 mx-auto opacity-90" />
                      <div className="text-white font-bold text-sm">No Pending Requests</div>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        All student businesses have been vetted! When new students register their store or request an official blue tick, their requests will appear right here in this section.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {pendingStores
                        .filter(s => {
                          if (!verificationSearch.trim()) return true;
                          const q = verificationSearch.toLowerCase();
                          return s.name.toLowerCase().includes(q) || s.ownerName.toLowerCase().includes(q) || s.location.toLowerCase().includes(q);
                        })
                        .map((store) => {
                          const storeProds = products.filter((p) => p.storeId === store.id);
                          const isExpanded = expandedStoreId === store.id;
                          const cleanPhone = (store.whatsappNumber || '').replace(/[^0-9]/g, '');

                          return (
                            <div
                              key={`req-${store.id}`}
                              className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/40 shadow-xl space-y-4 hover:border-amber-500/60 transition-all"
                            >
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex items-start gap-3.5 min-w-0">
                                  <img
                                    src={store.logoUrl || '/assets/aistudio/ss_b06f2828.PNG'}
                                    alt=""
                                    className="w-14 h-14 rounded-xl object-cover bg-slate-900 border border-slate-700 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-base font-bold text-white truncate">
                                        {store.name}
                                      </h4>
                                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Pending Verification Review
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium capitalize">
                                        {store.category.replace('_', ' ')}
                                      </span>
                                    </div>

                                    {store.tagline && (
                                      <p className="text-xs text-orange-400 font-medium mt-0.5">
                                        "{store.tagline}"
                                      </p>
                                    )}

                                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                      {store.description}
                                    </p>

                                    {/* Rich Metadata details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80 bg-slate-900/40 p-3 rounded-xl">
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className="text-slate-500">Student Owner:</span>
                                        <strong className="text-slate-200">{store.ownerName}</strong>
                                      </div>
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className="text-slate-500">Email:</span>
                                        <span className="text-slate-300 truncate">{store.ownerEmail}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 truncate">
                                        <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                        <span className="text-slate-500">Campus Location:</span>
                                        <strong className="text-slate-200 truncate">{store.location} ({store.university})</strong>
                                      </div>
                                      <div className="flex items-center gap-1.5 truncate">
                                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span className="text-slate-500">WhatsApp:</span>
                                        <strong className="text-emerald-400">{store.whatsappNumber}</strong>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                        <span className="text-slate-500">Delivery:</span>
                                        <span className="text-slate-200">{store.delivers ? store.deliveryNotes || 'Free on-campus' : 'Pickup only'}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-slate-500">Request Date:</span>
                                        <span className="text-slate-300">{store.verificationRequestDate ? new Date(store.verificationRequestDate).toLocaleDateString() : 'New Registration'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Decision Actions */}
                                <div className="flex flex-wrap sm:flex-col items-stretch gap-2 shrink-0 self-end sm:self-start">
                                  <button
                                    onClick={() => verifyStore(store.id)}
                                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Grant Verification Tick</span>
                                  </button>

                                  <a
                                    href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi ${store.ownerName}! This is HustleHub Admin regarding your store "${store.name}" on ${store.university} campus.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Chat on WhatsApp</span>
                                  </a>

                                  <button
                                    onClick={() => rejectStore(store.id)}
                                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900 text-xs font-medium transition-colors cursor-pointer"
                                  >
                                    Decline Request
                                  </button>
                                </div>
                              </div>

                              {/* Products Preview Drawer */}
                              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                                <span className="text-slate-400">
                                  Current Inventory: <strong className="text-white">{storeProds.length} item(s) listed</strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setExpandedStoreId(isExpanded ? null : store.id)}
                                  className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold cursor-pointer"
                                >
                                  <span>{isExpanded ? 'Hide Products' : 'Inspect Products Before Verifying'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              {isExpanded && (
                                <div className="pt-2 space-y-2">
                                  {storeProds.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic p-3 bg-slate-900/60 rounded-xl">No products added by this store yet. You can still verify the store profile so all items they post will be verified.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                      {storeProds.map((p) => (
                                        <div key={p.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                                          <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-700" />
                                          <div className="truncate text-xs">
                                            <div className="font-semibold text-white truncate">{p.title}</div>
                                            <div className="text-orange-400 font-bold">{p.currency}{p.price}</div>
                                            <div className="text-[10px] text-slate-400 capitalize">{p.condition} · {p.category}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Section B: Currently Verified Active Stores Directory */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        <span>Verified Student Businesses Directory ({verifiedStores.length})</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        These stores hold the official verified blue tick badge on their storefront and listings.
                      </p>
                    </div>
                  </div>

                  {verifiedStores.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">No verified stores on campus yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {verifiedStores.map((store) => (
                        <div
                          key={`verdir-${store.id}`}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={store.logoUrl || '/assets/aistudio/ss_b06f2828.PNG'}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover bg-slate-800 shrink-0 border border-slate-700"
                            />
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white truncate">{store.name}</span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              </div>
                              <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                                {store.ownerName} · {store.location}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => rejectStore(store.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700/60 text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
                            title="Revoke verification tick"
                          >
                            Revoke Tick
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: DETAILED ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <span>WhatsApp Clicks Total</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {totalWhatsAppClicks}
                    </div>
                    <div className="text-[11px] text-emerald-400 mt-1">
                      Direct student buyer chats
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span>Promotion Revenue</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      ${totalRevenue}.00
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Featured spots & Premium tiers
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <StoreIcon className="w-4 h-4 text-blue-400" />
                      <span>Registered Businesses</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {stores.length}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {verifiedStores.length} verified · {pendingStores.length} pending
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-4 h-4 text-orange-400" />
                      <span>Active Paid Upgrades</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {featuredStores.length + premiumStores.length}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {featuredStores.length} featured · {premiumStores.length} premium photo
                    </div>
                  </div>
                </div>

                {/* WhatsApp Click Traffic Leaderboard by Store */}
                <div className="p-4 sm:p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span>Store WhatsApp Traffic Leaderboard</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Tracks how many students clicked the WhatsApp button to contact each store
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[...stores]
                      .sort((a, b) => (b.whatsappClicks || 0) - (a.whatsappClicks || 0))
                      .map((store, index) => {
                        const percent = totalWhatsAppClicks > 0
                          ? Math.round(((store.whatsappClicks || 0) / totalWhatsAppClicks) * 100)
                          : 0;

                        return (
                          <div
                            key={store.id}
                            className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-bold text-slate-500 w-5">
                                #{index + 1}
                              </span>
                              <img
                                src={store.logoUrl || '/assets/aistudio/ss_b06f2828.PNG'}
                                alt=""
                                className="w-9 h-9 rounded-lg object-cover bg-slate-800 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-bold text-white truncate">
                                    {store.name}
                                  </h4>
                                  {store.isVerified && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  )}
                                  {store.isFeatured && (
                                    <span className="text-[9px] px-1.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                                      Featured
                                    </span>
                                  )}
                                  {store.hasPremiumLimit && (
                                    <span className="text-[9px] px-1.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                                      Premium Photos
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {store.ownerName} · {store.location} · {store.whatsappNumber}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-sm font-black text-emerald-400">
                                {store.whatsappClicks || 0} clicks
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {percent}% of all traffic
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Recent Event Log */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Recent Customer & Upgrade Activity Log
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {analyticsEvents.slice(0, 8).map((ev) => (
                      <div
                        key={ev.id}
                        className="py-1.5 px-2 rounded bg-slate-900/60 flex items-center justify-between text-slate-300"
                      >
                        <span className="flex items-center gap-2">
                          {ev.type === 'whatsapp_click' && <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />}
                          {ev.type === 'feature_purchase' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                          {ev.type === 'premium_purchase' && <Layers className="w-3.5 h-3.5 text-blue-400" />}
                          <strong className="text-white">{ev.storeName}</strong>
                          <span className="text-slate-400">
                            {ev.type === 'whatsapp_click' && `received inquiry for "${ev.productTitle || 'store'}"`}
                            {ev.type === 'feature_purchase' && `activated $${ev.amount} Home Page Featured Spot`}
                            {ev.type === 'premium_purchase' && `activated $${ev.amount} Premium Photos tier`}
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STORES VERIFICATION & MANAGEMENT */}
            {activeTab === 'stores' && (
              <div className="space-y-4">
                {/* Store Sub-filters */}
                <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
                  <button
                    onClick={() => setStoreFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      storeFilter === 'pending'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>Pending Verification</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
                      {pendingStores.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setStoreFilter('verified')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      storeFilter === 'verified'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>Verified Active ({verifiedStores.length})</span>
                  </button>

                  <button
                    onClick={() => setStoreFilter('unverified')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      storeFilter === 'unverified'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>Unverified ({unverifiedStores.length})</span>
                  </button>

                  <button
                    onClick={() => setStoreFilter('featured')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      storeFilter === 'featured'
                        ? 'bg-amber-500 text-black'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Paid Featured ({featuredStores.length})</span>
                  </button>

                  <button
                    onClick={() => setStoreFilter('premium')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      storeFilter === 'premium'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>Paid Premium Photos ({premiumStores.length})</span>
                  </button>

                  <button
                    onClick={() => setStoreFilter('frozen')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      storeFilter === 'frozen'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>Frozen ({frozenStores.length})</span>
                  </button>

                  <button
                    onClick={() => setStoreFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      storeFilter === 'all'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>All Stores ({stores.length})</span>
                  </button>
                </div>

                {/* Store Cards / Table */}
                <div className="space-y-3">
                  {displayedStores.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
                      No stores found under this filter.
                    </div>
                  ) : (
                    displayedStores.map((store) => {
                      const storeProds = products.filter((p) => p.storeId === store.id);
                      const isExpanded = expandedStoreId === store.id;

                      return (
                        <div
                          key={store.id}
                          className={`p-4 rounded-xl border transition-all ${
                            store.isFrozen
                              ? 'bg-rose-950/20 border-rose-900/40'
                              : (!store.isVerified && (store.verificationStatus === 'pending' || store.verificationRequested))
                              ? 'bg-amber-950/15 border-amber-500/40'
                              : 'bg-slate-950/70 border-slate-800'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <img
                                src={store.logoUrl || '/assets/aistudio/ss_b06f2828.PNG'}
                                alt=""
                                className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-slate-700 shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-bold text-white">
                                    {store.name}
                                  </h4>
                                  {store.isVerified ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Verified Tick
                                    </span>
                                  ) : store.verificationRequested || store.verificationStatus === 'pending' ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Requested Verification Tick
                                    </span>
                                  ) : (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                                      Unverified Store
                                    </span>
                                  )}
                                  {store.isFeatured && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-black font-bold">
                                      Featured Paid ($2)
                                    </span>
                                  )}
                                  {store.hasPremiumLimit && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600 text-white font-bold">
                                      Premium Photos Paid ($1)
                                    </span>
                                  )}
                                  {store.isFrozen && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white font-bold">
                                      Frozen
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-slate-300 mt-0.5">
                                  {store.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1.5">
                                  <span>Owner: <strong className="text-slate-200">{store.ownerName}</strong> ({store.ownerEmail})</span>
                                  <span>·</span>
                                  <span>Location: {store.location}</span>
                                  <span>·</span>
                                  <span>WhatsApp: {store.whatsappNumber}</span>
                                  <span>·</span>
                                  <span>Clicks: <strong className="text-emerald-400">{store.whatsappClicks || 0}</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* Admin Action Buttons */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              {/* Grant / Decline / Revoke Verification */}
                              {!store.isVerified ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => verifyStore(store.id)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Grant Verification Tick</span>
                                  </button>
                                  {(store.verificationRequested || store.verificationStatus === 'pending') && (
                                    <button
                                      onClick={() => rejectStore(store.id)}
                                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                                    >
                                      Decline
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => rejectStore(store.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700/60 text-xs font-medium transition-colors cursor-pointer"
                                  title="Revoke verification tick"
                                >
                                  Revoke Tick
                                </button>
                              )}

                              {/* Freeze / Unfreeze */}
                              {store.isFrozen ? (
                                <button
                                  onClick={() => unfreezeStore(store.id)}
                                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer"
                                >
                                  Unfreeze Store
                                </button>
                              ) : (
                                <button
                                  onClick={() => freezeStore(store.id, 'Administrative freeze')}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                                >
                                  Freeze
                                </button>
                              )}

                              {/* Expand Products */}
                              <button
                                onClick={() => setExpandedStoreId(isExpanded ? null : store.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span>{storeProds.length} Products</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              {/* Delete Store */}
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${store.name}" and all its listings?`)) {
                                    deleteStore(store.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Delete Store"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Products Drawer */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                              <h5 className="text-xs font-bold text-slate-300">
                                Products listed under {store.name}:
                              </h5>
                              {storeProds.length === 0 ? (
                                <p className="text-xs text-slate-500">No products listed by this store yet.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {storeProds.map((p) => (
                                    <div
                                      key={p.id}
                                      className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <img src={p.images[0]} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                                        <div className="truncate">
                                          <div className="font-semibold text-white truncate">{p.title}</div>
                                          <div className="text-slate-400">{p.currency}{p.price} · {p.whatsappInquiries} chats</div>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => deleteProduct(p.id)}
                                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: PROMOTIONS & UPGRADES ACTIVATION (ADMIN ONLY) */}
            {activeTab === 'promotions' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Store Promotion & Premium Tier Approvals</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Stores can request promotions in their dashboard, but only admins can approve and activate them here.
                  </p>
                </div>

                {/* Section A: Pending Promotion Requests */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <span>Pending Upgrade Requests</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                        {totalPromotionRequests}
                      </span>
                    </h4>
                  </div>

                  {totalPromotionRequests === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">
                      No pending promotion or premium upgrade requests right now.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Featured Requests */}
                      {requestedFeaturedStores.map((store) => (
                        <div
                          key={`feat-${store.id}`}
                          className="p-3 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={store.logoUrl || '/assets/aistudio/ss_b06f2828.PNG'}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{store.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
                                  Requested: Home Page Featured ($2/mo)
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Owner: {store.ownerName} ({store.ownerEmail}) · WhatsApp: {store.whatsappNumber}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => rejectFeaturedPromotion(store.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white cursor-pointer"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => approveFeaturedPromotion(store.id)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve & Activate ($2)</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Premium Photos Requests */}
                      {requestedPremiumStores.map((store) => (
                        <div
                          key={`prem-${store.id}`}
                          className="p-3 rounded-lg bg-slate-900 border border-blue-500/30 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={store.logoUrl || '/assets/aistudio/ss_b06f2828.PNG'}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{store.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/40">
                                  Requested: Unlimited Catalog & Photos ($1/mo)
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Owner: {store.ownerName} ({store.ownerEmail}) · WhatsApp: {store.whatsappNumber}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => rejectPremiumTier(store.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white cursor-pointer"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => approvePremiumTier(store.id)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-blue-600/20 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve & Activate ($1)</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section B: Active Featured Stores on Home Page */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Currently Active Featured Stores ({featuredStores.length})
                    </h4>
                  </div>

                  {featuredStores.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">No stores currently featured on home page.</p>
                  ) : (
                    <div className="space-y-2">
                      {featuredStores.map((st) => (
                        <div
                          key={st.id}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={st.logoUrl} alt="" className="w-8 h-8 rounded object-cover" />
                            <div>
                              <span className="font-bold text-white">{st.name}</span>
                              <span className="text-slate-500 ml-2">({st.location})</span>
                            </div>
                          </div>
                          <button
                            onClick={() => revokeFeaturedPromotion(st.id)}
                            className="text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded bg-slate-800 hover:bg-rose-950 cursor-pointer"
                          >
                            Revoke Featured
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section C: Active Premium Stores */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Stores With Premium Unlimited Photos Tier ({premiumStores.length})
                    </h4>
                  </div>

                  {premiumStores.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">No stores currently on premium tier.</p>
                  ) : (
                    <div className="space-y-2">
                      {premiumStores.map((st) => (
                        <div
                          key={st.id}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={st.logoUrl} alt="" className="w-8 h-8 rounded object-cover" />
                            <div>
                              <span className="font-bold text-white">{st.name}</span>
                              <span className="text-slate-500 ml-2">({st.category})</span>
                            </div>
                          </div>
                          <button
                            onClick={() => revokePremiumTier(st.id)}
                            className="text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded bg-slate-800 hover:bg-rose-950 cursor-pointer"
                          >
                            Revoke Premium
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: ALL PRODUCTS */}
            {activeTab === 'products' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Campus Product Catalog ({products.length})
                  </h3>
                  <span className="text-xs text-slate-400">
                    Inspect, review photos, and remove scam or counterfeit listings
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
                    >
                      <div className="flex gap-3 mb-2">
                        <img
                          src={p.images[0]}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover bg-slate-900 shrink-0 border border-slate-800"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                          <div className="text-xs text-orange-400 font-semibold">{p.currency}{p.price}</div>
                          <div className="text-[11px] text-slate-400 truncate">Store: {p.storeName}</div>
                          <div className="text-[10px] text-slate-500">
                            {p.whatsappInquiries} WhatsApp chats · {p.views} views
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 capitalize">{p.category}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Remove product "${p.title}"?`)) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: REPORTED CONTENT */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Reported Listings & Scams
                  </h3>
                  <span className="text-xs text-slate-400">
                    Community-flagged items protecting NUST students
                  </span>
                </div>

                {reports.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
                    No active student reports filed.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          report.status === 'pending'
                            ? 'bg-rose-950/20 border-rose-800/50'
                            : 'bg-slate-950/50 border-slate-800 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase font-bold text-rose-400">
                              [{report.reason.toUpperCase()}]
                            </span>
                            <h4 className="text-sm font-bold text-white">
                              {report.targetTitle}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              {report.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 mt-1">
                            {report.details}
                          </p>

                          <div className="text-[11px] text-slate-500 mt-1">
                            Reported by: {report.reporterEmail} · {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {report.status === 'pending' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                updateReportStatus(report.id, 'resolved');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium cursor-pointer"
                            >
                              Dismiss Report
                            </button>
                            <button
                              onClick={() => {
                                if (report.targetType === 'store') {
                                  freezeStore(report.targetId, report.details);
                                } else {
                                  deleteProduct(report.targetId);
                                }
                                updateReportStatus(report.id, 'resolved');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold cursor-pointer"
                            >
                              Take Action & Freeze
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: APPWRITE CLOUD INTEGRATION & COMPLETE SETUP GUIDE */}
            {activeTab === 'appwrite' && (
              <div className="space-y-6">
                
                {/* Header & Connection form */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Server className="w-4 h-4 text-orange-500" />
                        <span>Appwrite Connection Credentials</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Connect HustleHub to your Appwrite Cloud or self-hosted server
                      </p>
                    </div>

                    <button
                      onClick={handleCopySchema}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-orange-400" />}
                      <span>{copiedSchema ? 'Copied Full Schema!' : 'Copy Schema Specs'}</span>
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-3 rounded-xl border text-xs ${
                        testResult.success
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/60 border-rose-800 text-rose-300'
                      }`}
                    >
                      {testResult.message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Appwrite API Endpoint
                      </label>
                      <input
                        type="text"
                        value={appwriteEndpoint}
                        onChange={(e) => setAppwriteEndpoint(e.target.value)}
                        placeholder="https://cloud.appwrite.io/v1"
                        className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Project ID
                      </label>
                      <input
                        type="text"
                        value={appwriteProjectId}
                        onChange={(e) => setAppwriteProjectId(e.target.value)}
                        placeholder="e.g. 660f... or hustlehub-nust"
                        className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Database ID
                      </label>
                      <input
                        type="text"
                        value={appwriteDatabaseId}
                        onChange={(e) => setAppwriteDatabaseId(e.target.value)}
                        placeholder="hustlehub_db"
                        className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Storage Bucket ID (Product & Profile Pictures)
                      </label>
                      <input
                        type="text"
                        value={appwriteBucketId}
                        onChange={(e) => setAppwriteBucketId(e.target.value)}
                        placeholder="hustlehub_assets"
                        className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Toggle Advanced Collection IDs */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedCollections(!showAdvancedCollections)}
                      className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                    >
                      {showAdvancedCollections ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{showAdvancedCollections ? 'Hide Collection IDs' : 'Custom Collection IDs (if you used custom/auto IDs)'}</span>
                    </button>

                    {showAdvancedCollections && (
                      <div className="mt-2.5 p-3 rounded-lg bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Stores Collection ID</label>
                          <input
                            type="text"
                            value={appwriteStoresCollId}
                            onChange={(e) => setAppwriteStoresCollId(e.target.value)}
                            placeholder="stores"
                            className="w-full bg-slate-950 text-xs text-white px-2.5 py-1.5 rounded border border-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Products Collection ID</label>
                          <input
                            type="text"
                            value={appwriteProductsCollId}
                            onChange={(e) => setAppwriteProductsCollId(e.target.value)}
                            placeholder="products"
                            className="w-full bg-slate-950 text-xs text-white px-2.5 py-1.5 rounded border border-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Reports Collection ID</label>
                          <input
                            type="text"
                            value={appwriteReportsCollId}
                            onChange={(e) => setAppwriteReportsCollId(e.target.value)}
                            placeholder="reports"
                            className="w-full bg-slate-950 text-xs text-white px-2.5 py-1.5 rounded border border-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Analytics Events Collection ID</label>
                          <input
                            type="text"
                            value={appwriteEventsCollId}
                            onChange={(e) => setAppwriteEventsCollId(e.target.value)}
                            placeholder="analytics_events"
                            className="w-full bg-slate-950 text-xs text-white px-2.5 py-1.5 rounded border border-slate-800 font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isAppwriteLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      <span className="text-[11px] text-slate-400">
                        {isAppwriteLive ? (
                          <span className="text-emerald-400 font-medium">Real-time Cloud Connected & Synced</span>
                        ) : (
                          <span>Local storage active (Connect Appwrite to sync across all devices)</span>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={handleTestAppwrite}
                      disabled={isTesting}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors shadow-md disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {isTesting ? 'Verifying...' : 'Save & Test Connection'}
                    </button>
                  </div>
                </div>

                {/* COMPREHENSIVE APPWRITE DATABASE & TABLES GUIDE */}
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-400" />
                      <span>Complete Appwrite Setup Guide: Tables & Buckets</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Follow these exact steps in your Appwrite Console (https://cloud.appwrite.io) to link your backend.
                    </p>
                  </div>

                  {/* Step 1: Database */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px]">1</span>
                      <span>Create the Database in Appwrite</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-7">
                      Go to <strong>Databases</strong> in your Appwrite console and click <strong>Create Database</strong>:
                    </p>
                    <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Database Name: </span>
                        <strong className="text-white font-mono">HustleHub DB</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Database ID: </span>
                        <strong className="text-amber-400 font-mono">hustlehub_db</strong>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Collections / Tables */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px]">2</span>
                      <span>Create the 4 Collections (Tables) in `hustlehub_db`</span>
                    </div>

                    <div className="pl-7 space-y-3 text-xs">
                      
                      {/* Table 1: stores */}
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs flex items-center gap-1.5">
                            <StoreIcon className="w-3.5 h-3.5 text-blue-400" />
                            <span>Collection 1: <code className="text-orange-400 bg-black/40 px-1.5 py-0.5 rounded">stores</code></span>
                          </span>
                          <span className="text-[10px] text-slate-400">Collection ID: <code className="text-slate-300">stores</code></span>
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          Stores all registered student businesses, verification statuses, WhatsApp contacts, and paid feature flags.
                        </p>
                        <div className="p-2.5 rounded bg-black/40 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-0.5 overflow-x-auto">
                          <div><strong>Attributes to add:</strong></div>
                          <div className="text-amber-400 font-semibold">password (String, size 255, Optional) - Store sign-in password</div>
                          <div className="text-slate-400">id (String, size 100, Optional)</div>
                          <div className="text-slate-400">createdAt (String, size 100, Optional)</div>
                          <div className="text-slate-400">name (String, size 255, Required)</div>
                          <div className="text-slate-400">tagline (String, size 255)</div>
                          <div className="text-slate-400">description (String, size 2000, Required)</div>
                          <div className="text-slate-400">category (String, size 50, Required)</div>
                          <div className="text-slate-400">university (String, size 50, Default: "NUST")</div>
                          <div className="text-slate-400">location (String, size 255, Required)</div>
                          <div className="text-slate-400">delivers (Boolean, Default: true)</div>
                          <div className="text-slate-400">deliveryNotes (String, size 255)</div>
                          <div className="text-slate-400">whatsappNumber (String, size 50, Required)</div>
                          <div className="text-slate-400">whatsappClicks (Integer, Default: 0)</div>
                          <div className="text-slate-400">profileViews (Integer, Default: 0)</div>
                          <div className="text-slate-400">isVerified (Boolean, Default: true)</div>
                          <div className="text-slate-400">verificationStatus (String, size 20, Default: "verified")</div>
                          <div className="text-slate-400">isFrozen (Boolean, Default: false)</div>
                          <div className="text-slate-400">freezeReason (String, size 255)</div>
                          <div className="text-slate-400">isFeatured (Boolean, Default: false)</div>
                          <div className="text-slate-400">featuredRequested (Boolean, Default: false)</div>
                          <div className="text-slate-400">hasPremiumLimit (Boolean, Default: false)</div>
                          <div className="text-slate-400">premiumRequested (Boolean, Default: false)</div>
                          <div className="text-slate-400">logoUrl (String, size 1000)</div>
                          <div className="text-slate-400">bannerUrl (String, size 1000)</div>
                          <div className="text-slate-400">ownerId (String, size 100, Required)</div>
                          <div className="text-slate-400">ownerName (String, size 100, Required)</div>
                          <div className="text-slate-400">ownerEmail (String, size 100, Required)</div>
                          <div className="text-slate-400">rating (Float, Default: 5.0)</div>
                          <div className="text-slate-400">reviewCount (Integer, Default: 0)</div>
                        </div>
                      </div>

                      {/* Table 2: products */}
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
                            <span>Collection 2: <code className="text-orange-400 bg-black/40 px-1.5 py-0.5 rounded">products</code></span>
                          </span>
                          <span className="text-[10px] text-slate-400">Collection ID: <code className="text-slate-300">products</code></span>
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          Stores all items, textbook listings, trade preferences, and campus service offerings.
                        </p>
                        <div className="p-2.5 rounded bg-black/40 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-0.5 overflow-x-auto">
                          <div><strong>Attributes to add:</strong></div>
                          <div className="text-slate-400">id (String, size 100, Optional)</div>
                          <div className="text-slate-400">createdAt or createdat (String, size 100, Optional)</div>
                          <div className="text-slate-400">storeId or storeid (String, size 100, Required)</div>
                          <div className="text-slate-400">storeName or storename (String, size 100, Required)</div>
                          <div className="text-amber-400 font-semibold">storewhatsapp or storeWhatsApp (String, size 50, Required) - both work!</div>
                          <div className="text-slate-400">storeLocation or storelocation (String, size 255)</div>
                          <div className="text-slate-400">storeIsVerified or storeisverified (Boolean, Default: true)</div>
                          <div className="text-slate-400">title (String, size 255, Required)</div>
                          <div className="text-slate-400">description (String, size 2000, Required)</div>
                          <div className="text-slate-400">price (Float, Required)</div>
                          <div className="text-slate-400">currency (String, size 10, Default: "$")</div>
                          <div className="text-slate-400">category (String, size 50, Required)</div>
                          <div className="text-slate-400">isService (Boolean, Default: false)</div>
                          <div className="text-slate-400">condition (String, size 50, Default: "good")</div>
                          <div className="text-slate-400">isTradeable (Boolean, Default: false)</div>
                          <div className="text-slate-400">tradePreference (String, size 255)</div>
                          <div className="text-slate-400">images (String[], Array of URLs or String)</div>
                          <div className="text-slate-400">inStock (Boolean, Default: true)</div>
                          <div className="text-slate-400">views (Integer, Default: 0)</div>
                          <div className="text-slate-400">whatsappInquiries (Integer, Default: 0)</div>
                        </div>
                      </div>

                      {/* Table 3: reports */}
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs flex items-center gap-1.5">
                            <Flag className="w-3.5 h-3.5 text-rose-400" />
                            <span>Collection 3: <code className="text-orange-400 bg-black/40 px-1.5 py-0.5 rounded">reports</code></span>
                          </span>
                          <span className="text-[10px] text-slate-400">Collection ID: <code className="text-slate-300">reports</code></span>
                        </div>
                        <div className="p-2.5 rounded bg-black/40 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-0.5">
                          <div><strong>Attributes to add:</strong></div>
                          <div className="text-slate-400">targetType (String, size 20: "store" | "product")</div>
                          <div className="text-slate-400">targetId (String, size 100)</div>
                          <div className="text-slate-400">targetTitle (String, size 255)</div>
                          <div className="text-slate-400">reason (String, size 50)</div>
                          <div className="text-slate-400">details (String, size 1000)</div>
                          <div className="text-slate-400">reporterEmail (String, size 100)</div>
                          <div className="text-slate-400">status (String, size 20, Default: "pending")</div>
                        </div>
                      </div>

                      {/* Table 4: analytics_events */}
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Collection 4: <code className="text-orange-400 bg-black/40 px-1.5 py-0.5 rounded">analytics_events</code></span>
                          </span>
                          <span className="text-[10px] text-slate-400">Collection ID: <code className="text-slate-300">analytics_events</code></span>
                        </div>
                        <div className="p-2.5 rounded bg-black/40 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-0.5">
                          <div><strong>Attributes to add:</strong></div>
                          <div className="text-slate-400">type (String, size 50: "whatsapp_click" | "feature_purchase" | "premium_purchase")</div>
                          <div className="text-slate-400">storeId (String, size 100)</div>
                          <div className="text-slate-400">storeName (String, size 100)</div>
                          <div className="text-slate-400">productId (String, size 100)</div>
                          <div className="text-slate-400">productTitle (String, size 255)</div>
                          <div className="text-slate-400">amount (Float)</div>
                          <div className="text-slate-400">timestamp (String, size 50)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Storage Bucket */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px]">3</span>
                      <span>Create the Storage Bucket in Appwrite</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-7">
                      Go to <strong>Storage</strong> in Appwrite console and click <strong>Create Bucket</strong>:
                    </p>
                    <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Bucket Name: </span>
                        <strong className="text-white font-mono">HustleHub Media</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Bucket ID: </span>
                        <strong className="text-amber-400 font-mono">hustlehub_assets</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Allowed File Extensions: </span>
                        <strong className="text-slate-200 font-mono">jpg, jpeg, png, webp, gif</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Max File Size: </span>
                        <strong className="text-slate-200 font-mono">10MB</strong>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Permissions */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px]">4</span>
                      <span>Permissions Configuration (Crucial for Products & Stores)</span>
                    </div>
                    <div className="pl-7 text-xs text-slate-300 space-y-2 leading-relaxed">
                      <p>
                        In your Appwrite Console, navigate to each collection (<code className="text-orange-400 font-mono">stores</code>, <code className="text-orange-400 font-mono">products</code>, <code className="text-orange-400 font-mono">reports</code>, <code className="text-orange-400 font-mono">analytics_events</code>) and the storage bucket (<code className="text-orange-400 font-mono">hustlehub_assets</code>):
                      </p>
                      <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                        <strong>Click Settings &gt; Permissions:</strong>
                        <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-300">
                          <li>Click <strong>+ Add Role</strong> and choose <code className="text-emerald-400 font-bold">Any</code>.</li>
                          <li>Check <strong className="text-white">Create, Read, Update, Delete</strong>.</li>
                          <li>Click <strong>Update</strong> to save. This allows student sellers to create stores and add products directly from their browsers!</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Step 5: Vercel & Production Environment Variables */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px]">5</span>
                      <span>Vercel Deployment Environment Variables</span>
                    </div>
                    <div className="pl-7 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                      <p>
                        In your <strong>Vercel Project Settings &gt; Environment Variables</strong>, add the following variables so every visitor connects to your Appwrite automatically:
                      </p>
                      <div className="p-2.5 rounded bg-black/40 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1 overflow-x-auto">
                        <div><strong className="text-white">VITE_APPWRITE_ENDPOINT</strong> = <span className="text-emerald-400">https://cloud.appwrite.io/v1</span></div>
                        <div><strong className="text-white">VITE_APPWRITE_PROJECT_ID</strong> = <span className="text-amber-400">YOUR_APPWRITE_PROJECT_ID</span></div>
                        <div><strong className="text-white">VITE_APPWRITE_DATABASE_ID</strong> = <span className="text-slate-200">hustlehub_db</span></div>
                        <div><strong className="text-white">VITE_APPWRITE_BUCKET_ID</strong> = <span className="text-slate-200">hustlehub_assets</span></div>
                        <div><strong className="text-white">VITE_APPWRITE_STORES_COLLECTION_ID</strong> = <span className="text-slate-200">stores</span></div>
                        <div><strong className="text-white">VITE_APPWRITE_PRODUCTS_COLLECTION_ID</strong> = <span className="text-slate-200">products</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin Footer Bar */}
        <div className="px-5 py-2.5 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>HustleHub Administration & Moderation Console</span>
          <button
            type="button"
            onClick={openTerms}
            className="text-slate-400 hover:text-orange-400 hover:underline cursor-pointer"
          >
            Review Terms & Conditions Policy →
          </button>
        </div>
      </div>
    </div>
  );
};
