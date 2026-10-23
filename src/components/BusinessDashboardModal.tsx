import React, { useState } from 'react';
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
} from 'lucide-react';
import { Store, Product, StoreCategory, ProductCondition } from '../types';
import { useMarketplace } from '../context/MarketplaceContext';
import { uploadImageToStorage } from '../lib/appwrite';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface BusinessDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStorePreview: (store: Store) => void;
}

export const BusinessDashboardModal: React.FC<BusinessDashboardModalProps> = ({
  isOpen,
  onClose,
  onOpenStorePreview,
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
    updateStoreProfile,
    openTerms,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'products' | 'upgrades' | 'settings'>('products');
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

  // Edit Settings State
  const [editLocation, setEditLocation] = useState(currentStore?.location || '');
  const [editWhatsApp, setEditWhatsApp] = useState(currentStore?.whatsappNumber || '');
  const [editDelivers, setEditDelivers] = useState(currentStore?.delivers ?? true);
  const [editDeliveryNotes, setEditDeliveryNotes] = useState(currentStore?.deliveryNotes || '');
  const [settingsSaved, setSettingsSaved] = useState(false);

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
      const url = await uploadImageToStorage(file);
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

    if (result.success) {
      // Successfully published and pushed to Appwrite Cloud
      setUpgradeSuccessNotice(`"${prodTitle.trim()}" published live and synced to Appwrite Cloud!`);
      setTimeout(() => setUpgradeSuccessNotice(''), 4500);
      setShowAddProduct(false);
      setProdTitle('');
      setProdDescription('');
      setProdPrice('');
      setProdIsTradeable(false);
      setProdTradePref('');
      setProdImages([]);
    } else if (result.savedLocally) {
      // Saved on device, inform seller about Appwrite sync status
      setShowAddProduct(false);
      setUpgradeSuccessNotice(
        `"${prodTitle.trim()}" saved on your device! Notice: ${result.error || 'Syncing to Appwrite in progress...'}`
      );
      setTimeout(() => setUpgradeSuccessNotice(''), 6000);
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
    setUpgradeSuccessNotice('Featured Home Page spot requested! HustleHub Admin will review and activate your spot.');
    setTimeout(() => setUpgradeSuccessNotice(''), 4500);
  };

  const handleRequestPremium = () => {
    requestPremiumTier(currentStore.id);
    setUpgradeSuccessNotice('Premium Store upgrade requested! HustleHub Admin will review and activate your tier.');
    setTimeout(() => setUpgradeSuccessNotice(''), 4500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreProfile(currentStore.id, {
      location: editLocation,
      whatsappNumber: editWhatsApp,
      delivers: editDelivers,
      deliveryNotes: editDeliveryNotes,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={currentStore.logoUrl || '/assets/aistudio/ss_b06f2828.PNG'}
              alt=""
              className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {currentStore.name}
                </h2>
                {currentStore.isVerified ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Pending Admin Approval
                  </span>
                )}
                {currentStore.isFrozen && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                    Store Frozen
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {currentStore.university} Campus · Run by {currentStore.ownerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenStorePreview(currentStore)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors hidden sm:inline"
            >
              Public Preview
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {upgradeSuccessNotice && (
          <div className="p-3 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs text-center font-medium">
            {upgradeSuccessNotice}
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
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'products'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              My Products & Services ({storeProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('upgrades')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'upgrades'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Premium & Promotions</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Store Settings</span>
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
                        Product Photos (Appwrite Storage Bucket)
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

              {/* Local-only products awaiting cloud push banner */}
              {storeProducts.some((p) => !p.isSyncedToCloud) && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start sm:items-center gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                    <span>
                      <strong>Local Products Awaiting Cloud Sync:</strong> You have {storeProducts.filter(p => !p.isSyncedToCloud).length} product(s) uploaded locally on your device that are not yet live in Appwrite. Click below to push them directly into your Appwrite products table.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setSyncingAll(true);
                      const res = await syncAllLocalProductsToCloud();
                      setSyncingAll(false);
                      if (res.syncedCount > 0) {
                        setUpgradeSuccessNotice(`Successfully pushed ${res.syncedCount} product(s) into your Appwrite Cloud table!`);
                        setTimeout(() => setUpgradeSuccessNotice(''), 5000);
                      } else if (res.failedCount > 0) {
                        alert('Could not push to Appwrite yet. Please ensure your Appwrite tables and permissions are configured.');
                      }
                    }}
                    disabled={syncingAll}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold whitespace-nowrap cursor-pointer transition-colors shadow-sm self-start sm:self-auto"
                  >
                    {syncingAll ? 'Pushing to Appwrite...' : 'Sync All to Appwrite Now'}
                  </button>
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
                        {p.isSyncedToCloud ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Live on Appwrite</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold"
                              title={p.cloudSyncError || 'Awaiting sync'}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span className="hidden sm:inline">Local only</span>
                            </span>
                            <button
                              type="button"
                              onClick={async () => {
                                setSyncingProductId(p.id);
                                const res = await syncProductToCloud(p.id);
                                setSyncingProductId(null);
                                if (res.success) {
                                  setUpgradeSuccessNotice(`"${p.title}" pushed to Appwrite Cloud!`);
                                  setTimeout(() => setUpgradeSuccessNotice(''), 4500);
                                } else {
                                  alert(`Appwrite Error: ${res.error}`);
                                }
                              }}
                              disabled={syncingProductId === p.id}
                              className="text-[10px] px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white font-bold cursor-pointer transition-colors"
                            >
                              {syncingProductId === p.id ? 'Syncing...' : 'Push to Cloud'}
                            </button>
                          </div>
                        )}

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
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
                      <span className="text-base font-black text-white">$2 / month</span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1.5">
                      Front-Row Campus Spotlight
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
                        <span>Estimated 4x more WhatsApp customer inquiries</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    {currentStore.isFeatured ? (
                      <div className="text-center py-2 px-3 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold">
                        ✓ Currently Active on Home Page (Admin Activated)
                      </div>
                    ) : currentStore.featuredRequested ? (
                      <div className="text-center py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        <span>Request Pending Admin Activation</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleRequestFeatured}
                        className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Request Featured Spot ($2)</span>
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
                        Premium Store Tier
                      </span>
                      <span className="text-base font-black text-white">$1 / month</span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1.5">
                      Unlimited Items & Multi-Photos
                    </h4>
                    <ul className="text-xs text-slate-300 space-y-1.5 mb-4">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>List unlimited items (bypasses 3-item free limit)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Upload up to 6 high-res photos per product (bypasses 1-photo free limit)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>High-speed Appwrite Storage bucket integration</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    {currentStore.hasPremiumLimit ? (
                      <div className="text-center py-2 px-3 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-semibold">
                        ✓ Premium Limits Unlocked (Admin Activated)
                      </div>
                    ) : currentStore.premiumRequested ? (
                      <div className="text-center py-2 px-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                        <span>Request Pending Admin Activation</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleRequestPremium}
                        className="w-full py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Request Unlimited Tier ($1)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Store Settings */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-lg">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Location & Contact Details
                </h3>
                <p className="text-xs text-slate-400">
                  Keep your WhatsApp number and campus spot up to date so students can find you easily.
                </p>
              </div>

              {settingsSaved && (
                <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                  Store profile settings saved!
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Campus Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp Contact Number
                </label>
                <input
                  type="text"
                  value={editWhatsApp}
                  onChange={(e) => setEditWhatsApp(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
                  <input
                    type="checkbox"
                    checked={editDelivers}
                    onChange={(e) => setEditDelivers(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                  <span>Campus Delivery Offered</span>
                </label>

                {editDelivers && (
                  <input
                    type="text"
                    value={editDeliveryNotes}
                    onChange={(e) => setEditDeliveryNotes(e.target.value)}
                    placeholder="e.g. Free dorm delivery within 30 mins"
                    className="w-full bg-slate-900 text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                  />
                )}
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer"
              >
                Save Changes
              </button>
            </form>
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
