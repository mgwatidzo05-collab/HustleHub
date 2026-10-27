import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  MessageCircle,
  Eye,
  AlertTriangle,
  Upload,
  ArrowLeftRight,
  TrendingUp,
  CreditCard,
  Lock,
  Layers,
  Settings,
  MapPin,
  Truck,
  Scale,
  Edit3,
  Camera,
  Store as StoreIcon,
  Phone,
  Tag,
  UserCheck,
  Check,
  ExternalLink,
  EyeOff,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { Store, Product, StoreCategory, ProductCondition } from '../types';
import { useMarketplace } from '../context/MarketplaceContext';
import { uploadImageToStorage } from '../lib/appwrite';
import { compressImageFile } from '../lib/imageCompressor';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface BusinessDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStorePreview: (store: Store) => void;
  initialTab?: 'products' | 'profile' | 'upgrades';
}

export const BusinessDashboardModal: React.FC<BusinessDashboardModalProps> = ({
  isOpen,
  onClose,
  onOpenStorePreview,
  initialTab = 'products',
}) => {
  useBodyScrollLock(isOpen);
  const {
    currentStore,
    stores,
    products,
    addProduct,
    deleteProduct,
    syncProductToCloud,
    syncAllLocalProductsToCloud,
    requestFeaturedPromotion,
    requestPremiumTier,
    instantActivateFeatured,
    instantActivatePremium,
    requestStoreVerification,
    updateStoreProfile,
    openTerms,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'products' | 'profile' | 'upgrades'>(initialTab);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [upgradeSuccessNotice, setUpgradeSuccessNotice] = useState('');
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingProductId, setSyncingProductId] = useState<string | null>(null);

  // Add Product State
  const [prodTitle, setProdTitle] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [prodCategory, setProdCategory] = useState<StoreCategory>(currentStore?.category || 'electronics');
  const [prodCondition, setProdCondition] = useState<ProductCondition>('good');
  const [prodIsService, setProdIsService] = useState(false);
  const [prodIsTradeable, setProdIsTradeable] = useState(false);
  const [prodTradePref, setProdTradePref] = useState('');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productError, setProductError] = useState('');

  // Business Profile Edit State
  const [editName, setEditName] = useState(currentStore?.name || '');
  const [editOwnerName, setEditOwnerName] = useState(currentStore?.ownerName || '');
  const [editWhatsApp, setEditWhatsApp] = useState(currentStore?.whatsappNumber || '');
  const [editLogoUrl, setEditLogoUrl] = useState(currentStore?.logoUrl || '');
  const [editBannerUrl, setEditBannerUrl] = useState(currentStore?.bannerUrl || '');
  const [editTagline, setEditTagline] = useState(currentStore?.tagline || '');
  const [editDescription, setEditDescription] = useState(currentStore?.description || '');
  const [editCategory, setEditCategory] = useState<StoreCategory>(currentStore?.category || 'electronics');
  const [editLocation, setEditLocation] = useState(currentStore?.location || '');
  const [editDelivers, setEditDelivers] = useState(currentStore?.delivers ?? true);
  const [editDeliveryNotes, setEditDeliveryNotes] = useState(currentStore?.deliveryNotes || '');
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedNotice, setProfileSavedNotice] = useState('');
  const [profileError, setProfileError] = useState('');

  // Synchronize edit fields whenever currentStore changes or modal opens
  useEffect(() => {
    if (currentStore) {
      setEditName(currentStore.name || '');
      setEditOwnerName(currentStore.ownerName || '');
      setEditWhatsApp(currentStore.whatsappNumber || '');
      setEditLogoUrl(currentStore.logoUrl || '');
      setEditBannerUrl(currentStore.bannerUrl || '');
      setEditTagline(currentStore.tagline || '');
      setEditDescription(currentStore.description || '');
      setEditCategory(currentStore.category || 'electronics');
      setEditLocation(currentStore.location || '');
      setEditDelivers(currentStore.delivers ?? true);
      setEditDeliveryNotes(currentStore.deliveryNotes || '');
      setEditPassword('');
      setProfileError('');
    }
  }, [currentStore, isOpen]);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen || !currentStore) return null;

  const storeProducts = products.filter((p) => p.storeId === currentStore.id);
  const isFreeTierAtLimit = !currentStore.hasPremiumLimit && storeProducts.length >= 3;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check limit: Free tier is strictly 1 pic per product
    if (!currentStore.hasPremiumLimit && prodImages.length >= 1) {
      alert('Free tier allows 1 photo per product. Upgrade to Premium Store ($1/mo) to upload up to 6 high-res photos!');
      return;
    }

    setUploadingImage(true);
    try {
      const file = files[0];
      const url = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
      setProdImages((prev) => [...prev, url]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError('');

    if (!prodTitle.trim()) return setProductError('Please enter a product title');
    if (prodPrice === '' || Number(prodPrice) < 0) return setProductError('Please enter a valid price');

    const result = await addProduct({
      storeId: currentStore.id,
      storeName: currentStore.name,
      storeWhatsApp: currentStore.whatsappNumber,
      storeLocation: currentStore.location,
      storeIsVerified: currentStore.isVerified,
      title: prodTitle.trim(),
      description: prodDescription.trim(),
      price: Number(prodPrice),
      currency: '$',
      category: prodCategory,
      isService: prodIsService,
      condition: prodCondition,
      isTradeable: prodIsTradeable,
      tradePreference: prodIsTradeable ? prodTradePref.trim() : undefined,
      images: prodImages.length > 0 ? prodImages : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
      inStock: true,
    });

    if (result.success || result.savedLocally) {
      setUpgradeSuccessNotice(`"${prodTitle.trim()}" published live and visible to campus students!`);
      setTimeout(() => setUpgradeSuccessNotice(''), 4500);
      setShowAddProduct(false);
      setProdTitle('');
      setProdDescription('');
      setProdPrice('');
      setProdIsTradeable(false);
      setProdTradePref('');
      setProdImages([]);
    } else {
      setProductError(result.error || 'Failed to add product');
      return;
    }
  };

  const handleRequestFeatured = () => {
    requestFeaturedPromotion(currentStore.id);
    setUpgradeSuccessNotice('Featured Home Page spotlight requested! HustleHub Admin will activate your spotlight.');
    setTimeout(() => setUpgradeSuccessNotice(''), 5000);
  };

  const handleRequestPremium = () => {
    requestPremiumTier(currentStore.id);
    setUpgradeSuccessNotice('Premium Unlimited Tier requested! HustleHub Admin will activate your unlimited listing tier.');
    setTimeout(() => setUpgradeSuccessNotice(''), 5000);
  };

  const handleRequestVerification = () => {
    requestStoreVerification(currentStore.id);
    setUpgradeSuccessNotice('Campus Verification Badge requested! HustleHub Admin will review your store credentials.');
    setTimeout(() => setUpgradeSuccessNotice(''), 4500);
  };


  const CATEGORY_OPTIONS: { id: StoreCategory; label: string }[] = [
    { id: 'electronics', label: 'Electronics & Gadgets' },
    { id: 'textbooks', label: 'Textbooks & Notes' },
    { id: 'dorm', label: 'Dorm Essentials & Kettles' },
    { id: 'barber', label: 'Barber & Hair Styling' },
    { id: 'nail_tech', label: 'Nail Tech & Beauty' },
    { id: 'printing', label: 'Printing & Thesis Binding' },
    { id: 'laundry', label: 'Student Laundry' },
    { id: 'tutoring', label: 'Tutoring & Academic Prep' },
    { id: 'clothing', label: 'Thrift & Fashion' },
    { id: 'food_snacks', label: 'Campus Snacks & Meals' },
    { id: 'repairs', label: 'Hardware & Tech Repairs' },
    { id: 'other_service', label: 'Other Student Service' },
  ];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setProfileError('');
    try {
      const url = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
      setEditLogoUrl(url);
    } catch (err: any) {
      console.error(err);
      setProfileError('Failed to upload logo image from gallery. Please try another image.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setProfileError('');
    try {
      const url = await compressImageFile(file, { maxWidth: 1400, maxHeight: 800, quality: 0.85 });
      setEditBannerUrl(url);
    } catch (err: any) {
      console.error(err);
      setProfileError('Failed to upload cover banner from gallery. Please try another image.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setProfileError('Please provide a business name.');
      return;
    }

    const cleanPhone = editWhatsApp.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 7) {
      setProfileError('Please provide a valid WhatsApp number with country code (e.g. +263 77 123 4567).');
      return;
    }

    if (editPassword && editPassword.trim().length < 6) {
      setProfileError('New password must be at least 6 characters.');
      return;
    }

    setSavingProfile(true);

    const updates: Partial<Store> = {
      name: trimmedName,
      ownerName: editOwnerName.trim() || currentStore.ownerName,
      whatsappNumber: cleanPhone,
      logoUrl: editLogoUrl.trim() || currentStore.logoUrl,
      bannerUrl: editBannerUrl.trim() || undefined,
      tagline: editTagline.trim(),
      description: editDescription.trim(),
      category: editCategory,
      location: editLocation.trim(),
      delivers: editDelivers,
      deliveryNotes: editDelivers ? editDeliveryNotes.trim() : undefined,
    };

    if (editPassword.trim()) {
      updates.password = editPassword.trim();
    }

    updateStoreProfile(currentStore.id, updates);
    setSavingProfile(false);
    setProfileSavedNotice('Business profile updated! Your new name, phone number, and profile picture are now live.');
    setTimeout(() => setProfileSavedNotice(''), 5500);
  };

  const handleDiscardProfileChanges = () => {
    setEditName(currentStore.name || '');
    setEditOwnerName(currentStore.ownerName || '');
    setEditWhatsApp(currentStore.whatsappNumber || '');
    setEditLogoUrl(currentStore.logoUrl || '');
    setEditBannerUrl(currentStore.bannerUrl || '');
    setEditTagline(currentStore.tagline || '');
    setEditDescription(currentStore.description || '');
    setEditCategory(currentStore.category || 'electronics');
    setEditLocation(currentStore.location || '');
    setEditDelivers(currentStore.delivers ?? true);
    setEditDeliveryNotes(currentStore.deliveryNotes || '');
    setEditPassword('');
    setProfileError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative group shrink-0">
              <img
                src={currentStore.logoUrl || '/assets/aistudio/ss_b06f2828.PNG'}
                alt=""
                className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-800"
              />
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                title="Change Logo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white truncate">
                  {currentStore.name}
                </h2>
                {currentStore.isVerified ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Hustle
                  </span>
                ) : currentStore.verificationRequested || currentStore.verificationStatus === 'pending' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Verification Under Review
                  </span>
                ) : (
                  <button
                    onClick={handleRequestVerification}
                    className="text-[10px] px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 font-semibold border border-blue-500/40 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Request campus verification badge"
                  >
                    <CheckCircle2 className="w-3 h-3 text-blue-400" />
                    <span>Request Verification Tick</span>
                  </button>
                )}
                {currentStore.isFrozen && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                    Store Frozen
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                {currentStore.university} Campus · Run by {currentStore.ownerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeTab !== 'profile' && (
              <button
                onClick={() => setActiveTab('profile')}
                className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-xs font-bold text-orange-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Profile</span>
              </button>
            )}
            <button
              onClick={() => onOpenStorePreview(currentStore)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors hidden sm:inline"
            >
              Public Preview
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {(upgradeSuccessNotice || profileSavedNotice) && (
          <div className="p-3 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs text-center font-medium flex items-center justify-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{profileSavedNotice || upgradeSuccessNotice}</span>
          </div>
        )}

        {/* Dashboard Body */}
        <div className="p-4 sm:p-6 space-y-6">
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Clicks</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {currentStore.whatsappClicks || 0}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                Direct buyer chats
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Store Views</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {currentStore.profileViews || 0}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Campus impressions
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                <Layers className="w-3.5 h-3.5 text-orange-400" />
                <span>Active Listings</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {storeProducts.length}
                {!currentStore.hasPremiumLimit && (
                  <span className="text-xs text-slate-500 font-normal ml-1">/ 3 free</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {currentStore.hasPremiumLimit ? 'Unlimited Tier' : 'Free Tier'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Featured Status</span>
              </div>
              <div className="text-sm font-bold text-white mt-1">
                {currentStore.isFeatured ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="text-slate-400">Standard</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {currentStore.isFeatured ? '30-day pin active' : 'Not on Home Spotlight'}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
                activeTab === 'products'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Catalog & Listings ({storeProducts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Store Profile</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                activeTab === 'profile' ? 'bg-black/30 text-white' : 'bg-orange-500/20 text-orange-300'
              }`}>
                Logo & Phone
              </span>
            </button>
            <button
              onClick={() => setActiveTab('upgrades')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
                activeTab === 'upgrades'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Premium & Promotions</span>
            </button>
          </div>

          {/* TAB 1: Products Management */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Catalog Inventory</h3>
                  <p className="text-xs text-slate-400">
                    Students will click WhatsApp to chat with you about these listings.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddProduct(true)}
                  disabled={isFreeTierAtLimit}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isFreeTierAtLimit
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 active:scale-95'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Free tier limit callout */}
              {isFreeTierAtLimit && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                  <div className="text-amber-300">
                    <strong>Free Tier Limit Reached:</strong> You have listed 3 products. Upgrade to the Premium Store tier to add unlimited products and multi-photo galleries!
                  </div>
                  <button
                    onClick={() => setActiveTab('upgrades')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold whitespace-nowrap cursor-pointer"
                  >
                    Upgrade for $1
                  </button>
                </div>
              )}

              {/* Add Product Modal Form */}
              {showAddProduct && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-700/80 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-bold text-white">New Product / Service</h4>
                    <button
                      onClick={() => setShowAddProduct(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  {productError && (
                    <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                      {productError}
                    </div>
                  )}

                  <form onSubmit={handleAddProductSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Item / Service Title
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Casio fx-991EX Calculator, 1TB SSD, Hair Fade"
                          value={prodTitle}
                          onChange={(e) => setProdTitle(e.target.value)}
                          className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Price (USD $)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          required
                          placeholder="e.g. 15"
                          value={prodPrice}
                          onChange={(e) => setProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Category
                        </label>
                        <select
                          value={prodCategory}
                          onChange={(e) => setProdCategory(e.target.value as StoreCategory)}
                          className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                        >
                          <option value="electronics">Electronics</option>
                          <option value="textbooks">Textbooks</option>
                          <option value="dorm">Dorm Essentials</option>
                          <option value="barber">Barber</option>
                          <option value="nail_tech">Nail Tech</option>
                          <option value="printing">Printing</option>
                          <option value="laundry">Laundry</option>
                          <option value="tutoring">Tutoring</option>
                          <option value="clothing">Clothing</option>
                          <option value="food_snacks">Food / Snacks</option>
                          <option value="repairs">Tech Repairs</option>
                          <option value="other_service">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Condition
                        </label>
                        <select
                          value={prodCondition}
                          onChange={(e) => setProdCondition(e.target.value as ProductCondition)}
                          className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                        >
                          <option value="brand_new">Brand New</option>
                          <option value="like_new">Like New</option>
                          <option value="good">Good Condition</option>
                          <option value="fair">Fair</option>
                          <option value="service">Service Offering</option>
                        </select>
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={prodIsService}
                            onChange={(e) => setProdIsService(e.target.checked)}
                            className="w-4 h-4 accent-orange-500 rounded"
                          />
                          <span>Is this a Service? (Barber, laundry, printing)</span>
                        </label>
                      </div>
                    </div>

                    {/* Trade / Swap Toggle */}
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
                        <input
                          type="checkbox"
                          checked={prodIsTradeable}
                          onChange={(e) => setProdIsTradeable(e.target.checked)}
                          className="w-4 h-4 accent-orange-500 rounded"
                        />
                        <ArrowLeftRight className="w-3.5 h-3.5 text-orange-400" />
                        <span>Open to Trade / Swap for other student items?</span>
                      </label>

                      {prodIsTradeable && (
                        <input
                          type="text"
                          placeholder="e.g. Willing to swap for Calculus 2 textbook or desk chair"
                          value={prodTradePref}
                          onChange={(e) => setProdTradePref(e.target.value)}
                          className="w-full bg-slate-950 text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Key specifications, warranty, what is included, etc."
                        value={prodDescription}
                        onChange={(e) => setProdDescription(e.target.value)}
                        className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500 resize-none"
                      />
                    </div>

                    {/* Image Upload Box */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Product Photos (From Device Gallery or Camera)
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {prodImages.map((img, i) => (
                          <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setProdImages(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-0.5 right-0.5 bg-black/70 text-rose-400 p-0.5 rounded text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        <label className="cursor-pointer">
                          <div className="w-14 h-14 rounded-lg bg-slate-900 border border-dashed border-slate-700 hover:border-orange-500 text-slate-400 flex flex-col items-center justify-center text-[10px] transition-colors">
                            <Upload className="w-4 h-4 mb-0.5" />
                            <span>{uploadingImage ? '...' : 'Photo'}</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {currentStore.hasPremiumLimit ? 'Premium store: Up to 6 photos per item' : 'Free tier: 1 photo per product (Upgrade to Premium for $1/mo for up to 6 photos)'}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddProduct(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Save & List Item
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Product List */}
              {storeProducts.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/30 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
                  No products in your store yet. Click "Add Product" above to list your first item!
                </div>
              ) : (
                <div className="space-y-2">
                  {storeProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.images[0] || '/assets/aistudio/ss_b06f2828.PNG'}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-slate-900 shrink-0 border border-slate-800"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">
                            {p.title}
                          </h4>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="text-orange-400 font-semibold">{p.currency}{p.price}</span>
                            <span>·</span>
                            <span>{p.whatsappInquiries} WhatsApp chats</span>
                            <span>·</span>
                            <span>{p.views} views</span>
                            {p.isTradeable && (
                              <span className="text-amber-400 font-medium">· Tradeable</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Published</span>
                        </span>

                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Upgrades & Monetization */}
          {activeTab === 'upgrades' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Grow Your Campus Sales
                </h3>
                <p className="text-xs text-slate-400">
                  Students browse for free. Stores can upgrade for higher visibility and expanded media storage.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Upgrade 1: Featured Home Page Spotlight */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  currentStore.isFeatured
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-slate-950/70 border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Home Page Featured
                      </span>
                      <span className="text-base font-black text-white">$2 / mo</span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1.5">
                      Front-Row Spotlight
                    </h4>
                    <ul className="text-xs text-slate-300 space-y-1.5 mb-4">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pinned to top "Featured Hustlers" carousel</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Gold featured badge on all store cards</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Estimated 4x more WhatsApp customer chats</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    {currentStore.isFeatured ? (
                      <div className="text-center py-2.5 px-3 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-amber-500/40">
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        <span>✓ Active on Home Page Spotlight</span>
                      </div>
                    ) : currentStore.featuredRequested ? (
                      <div className="text-center py-2.5 px-3 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                        <span>Activation Requested · Awaiting Admin Approval</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestFeatured}
                        className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Request Featured Page Activation ($2/mo)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Upgrade 2: Premium Multi-Photo & Unlimited Catalog */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  currentStore.hasPremiumLimit
                    ? 'bg-blue-500/10 border-blue-500/40'
                    : 'bg-slate-950/70 border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        Premium Tier
                      </span>
                      <span className="text-base font-black text-white">$1 / mo</span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1.5">
                      Unlimited Items & Photos
                    </h4>
                    <ul className="text-xs text-slate-300 space-y-1.5 mb-4">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>List unlimited items (bypasses 3-item limit)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Upload up to 6 high-res photos per listing</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>High-speed cloud image gallery storage</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    {currentStore.hasPremiumLimit ? (
                      <div className="text-center py-2.5 px-3 rounded-xl bg-blue-500/20 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-blue-500/40">
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        <span>✓ Unlimited Tier Unlocked & Active</span>
                      </div>
                    ) : currentStore.premiumRequested ? (
                      <div className="text-center py-2.5 px-3 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                        <span>Activation Requested · Awaiting Admin Approval</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestPremium}
                        className="w-full py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Request Premium Tier Activation ($1/mo)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Upgrade 3: Campus Verification Badge */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  currentStore.isVerified
                    ? 'bg-blue-500/10 border-blue-500/40'
                    : 'bg-slate-950/70 border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified Badge
                      </span>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Free Trust Badge</span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1.5">
                      Campus Verification Tick
                    </h4>
                    <ul className="text-xs text-slate-300 space-y-1.5 mb-4">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Official verified tick on store and all listings</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Builds instant trust with campus buyers</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Vetted student entrepreneur badge</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    {currentStore.isVerified ? (
                      <div className="text-center py-2 px-3 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>✓ Officially Verified Store</span>
                      </div>
                    ) : currentStore.verificationRequested || currentStore.verificationStatus === 'pending' ? (
                      <div className="text-center py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>Verification Under Review</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleRequestVerification}
                        className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Request Verification Tick</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: Edit Store Profile & Branding */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-orange-400" />
                    <span>Business Profile & Branding</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update your business name, profile photo / logo, phone number, and campus location anytime.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDiscardProfileChanges}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenStorePreview({
                      ...currentStore,
                      name: editName || currentStore.name,
                      logoUrl: editLogoUrl || currentStore.logoUrl,
                      bannerUrl: editBannerUrl || currentStore.bannerUrl,
                      tagline: editTagline || currentStore.tagline,
                      whatsappNumber: editWhatsApp || currentStore.whatsappNumber,
                      location: editLocation || currentStore.location,
                      category: editCategory,
                    })}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Live Preview</span>
                  </button>
                </div>
              </div>

              {profileError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSavedNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{profileSavedNotice}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                
                {/* Visual Identity Section (Logo + Banner) */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Visual Identity & Logos</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      High-resolution student branding
                    </span>
                  </div>

                  {/* Profile Picture / Logo Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="relative group shrink-0">
                      <img
                        src={editLogoUrl || currentStore.logoUrl || '/assets/aistudio/ss_b06f2828.PNG'}
                        alt="Store Logo"
                        className="w-20 h-20 rounded-2xl object-cover bg-slate-800 border-2 border-orange-500/40 shadow-lg"
                      />
                      {uploadingLogo && (
                        <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                          Uploading...
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer">
                          <span className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer active:scale-95">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingLogo ? 'Uploading from Gallery...' : 'Upload from Gallery'}</span>
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingLogo}
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>

                        {editLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setEditLogoUrl('')}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-colors border border-slate-700/60 cursor-pointer"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Upload your store logo or personal business picture directly from your phone or device photos.
                      </p>
                    </div>
                  </div>

                  {/* Optional Cover Banner */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        Cover Banner Image (Optional)
                      </label>
                      {editBannerUrl && (
                        <button
                          type="button"
                          onClick={() => setEditBannerUrl('')}
                          className="text-[11px] text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          Clear Banner
                        </button>
                      )}
                    </div>
                    {editBannerUrl && (
                      <div className="h-24 w-full rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
                        <img src={editBannerUrl} alt="Cover Banner" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <label className="cursor-pointer inline-block">
                        <span className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer active:scale-95">
                          <Upload className="w-3.5 h-3.5 text-orange-400" />
                          <span>{uploadingBanner ? 'Uploading Banner...' : 'Upload Banner from Gallery'}</span>
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingBanner}
                          onChange={handleBannerUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Business Name & Core Details */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                      <StoreIcon className="w-3.5 h-3.5" />
                      <span>Business Name & Category</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Syncs to all active listings
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Business / Store Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. NUST Tech Fix, Campus Cuts, Dorm Essentials"
                        className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500 font-semibold"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        This name is displayed to campus buyers across search, category listings, and product cards.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Primary Category *
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as StoreCategory)}
                        className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Determines where your store is indexed in the Student Stores portal.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Founder / Owner Name
                      </label>
                      <div className="relative">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={editOwnerName}
                          onChange={(e) => setEditOwnerName(e.target.value)}
                          placeholder="Your name or business manager"
                          className="w-full bg-slate-900 text-xs text-white pl-8 pr-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Catchy Tagline / Slogan
                      </label>
                      <div className="relative">
                        <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={editTagline}
                          onChange={(e) => setEditTagline(e.target.value)}
                          placeholder="e.g. Fast campus delivery within 20 mins"
                          className="w-full bg-slate-900 text-xs text-white pl-8 pr-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Business Bio & Description
                    </label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Tell campus students about your products, warranty, working hours, and what makes your hustle great..."
                      className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Direct Contact & WhatsApp */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Contact & WhatsApp Number</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Direct Buyer Link
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      WhatsApp Contact Number *
                    </label>
                    <div className="relative">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={editWhatsApp}
                        onChange={(e) => setEditWhatsApp(e.target.value)}
                        placeholder="e.g. +263 77 123 4567"
                        className="w-full bg-slate-900 text-xs text-white pl-8 pr-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Include country code (e.g. +263 for Zimbabwe). When students tap "Chat on WhatsApp", this number opens directly.
                    </p>
                  </div>

                  {editWhatsApp && editWhatsApp.replace(/\D/g, '').length >= 7 && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300">
                        Active WhatsApp contact: <strong className="text-white">{editWhatsApp}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Campus Location & Delivery */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Campus Location & Delivery</span>
                  </span>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Campus Spot / Dorm / Residence *
                    </label>
                    <input
                      type="text"
                      required
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="e.g. Block 4, Room 14 or Outside Library Quad"
                      className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
                      <input
                        type="checkbox"
                        checked={editDelivers}
                        onChange={(e) => setEditDelivers(e.target.checked)}
                        className="w-4 h-4 accent-orange-500 rounded"
                      />
                      <Truck className="w-3.5 h-3.5 text-orange-400" />
                      <span>Campus Delivery Offered (Drop off at student dorms or lecture halls)</span>
                    </label>

                    {editDelivers && (
                      <input
                        type="text"
                        value={editDeliveryNotes}
                        onChange={(e) => setEditDeliveryNotes(e.target.value)}
                        placeholder="e.g. Free dorm delivery within 30 mins, or $1 for off-campus"
                        className="w-full bg-slate-950 text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                      />
                    )}
                  </div>
                </div>

                {/* Password / Account Update (Optional) */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Change Account Password (Optional)</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      For sign in on other devices
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Leave blank to keep your current password"
                      className="w-full bg-slate-900 text-xs text-white px-3 py-2 pr-10 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                    />
                    {editPassword && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {editPassword && (
                    <p className="text-[10px] text-amber-400">
                      Minimum 6 characters. Make sure you remember your new password.
                    </p>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDiscardProfileChanges}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Discard Changes
                  </button>

                  <button
                    type="submit"
                    disabled={savingProfile || uploadingLogo || uploadingBanner}
                    className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/25 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    {savingProfile ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Dashboard Footer Bar */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div>
            Operating as a registered student business at <strong className="text-slate-300">{currentStore.university}</strong>
          </div>
          <button
            type="button"
            onClick={openTerms}
            className="text-slate-400 hover:text-orange-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5 text-orange-400" />
            <span>Business Terms & Guidelines →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
