import React from 'react';
import {
  X,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Truck,
  Sparkles,
  ShoppingBag,
  ShieldAlert,
  Edit,
  Share2,
  Star,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Store, Product } from '../types';
import { useMarketplace } from '../context/MarketplaceContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { ProductCard } from './ProductCard';

interface StoreDetailModalProps {
  store: Store | null;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onOpenStoreDashboard: (tab?: 'products' | 'profile' | 'upgrades') => void;
  onOpenReport: (targetType: 'product' | 'store', targetId: string, title: string) => void;
}

export const StoreDetailModal: React.FC<StoreDetailModalProps> = ({
  store,
  onClose,
  onSelectProduct,
  onOpenStoreDashboard,
  onOpenReport,
}) => {
  useBodyScrollLock(Boolean(store));
  const { currentStore, products, trackWhatsAppClick, openTerms } = useMarketplace();

  if (!store) return null;

  const isOwner = currentStore?.id === store.id;
  const storeProducts = products.filter((p) => p.storeId === store.id);

  const handleWhatsApp = () => {
    trackWhatsAppClick(store.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="relative h-40 sm:h-52 w-full bg-slate-800">
          {store.bannerUrl ? (
            <img
              src={store.bannerUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-950 via-slate-900 to-amber-950 flex items-center justify-center">
              <span className="text-4xl font-black text-slate-800 uppercase tracking-widest">
                {store.name}
              </span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Featured pill */}
          {store.isFeatured && (
            <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-amber-500 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Featured Store</span>
            </div>
          )}
        </div>

        {/* Store Profile Info */}
        <div className="p-4 sm:p-6 relative pt-0">
          
          {/* Avatar & Action Row */}
          <div className="flex flex-wrap items-end justify-between -mt-10 sm:-mt-12 mb-4 gap-3">
            <div className="flex items-end gap-3.5">
              <img
                src={store.logoUrl || '/assets/aistudio/ss_b06f2828.PNG'}
                alt={store.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-slate-900 border-4 border-slate-900 shadow-xl"
              />
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {store.name}
                  </h1>
                  {store.isVerified ? (
                    <span className="text-blue-400" title="Verified Campus Business">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                  ) : (store.verificationRequested || store.verificationStatus === 'pending') ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                      Pending Verification
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-orange-400 font-medium">
                  {store.tagline || store.category.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-2">
              {isOwner ? (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenStoreDashboard('profile');
                    }}
                    className="px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenStoreDashboard('products');
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Manage Inventory</span>
                  </button>
                </>
              ) : null}

              {store.isFrozen ? (
                <div className="px-3.5 py-2 rounded-xl bg-rose-950/80 text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-rose-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Store Temporarily Paused</span>
                </div>
              ) : (
                <button
                  onClick={handleWhatsApp}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </button>
              )}
            </div>
          </div>

          {/* Bio & Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2 space-y-3">
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                {store.description}
              </p>
            </div>

            {/* Details Box */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{store.location}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{store.delivers ? (store.deliveryNotes || 'Campus delivery available') : 'Campus Pickup / In-person'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Run by {store.ownerName}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-slate-400 flex items-center justify-between text-[11px]">
                <span>{store.whatsappClicks} WhatsApp connections</span>
                <span className="text-slate-200 font-semibold">{store.rating > 0 ? `${store.rating.toFixed(1)} ★` : 'New'}</span>
              </div>
            </div>
          </div>

          {/* Store Products Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-500" />
                <h2 className="text-base font-bold text-white">
                  Available Items & Services ({storeProducts.length})
                </h2>
              </div>
            </div>

            {storeProducts.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                <p className="text-sm text-slate-400">
                  This student store hasn't added products yet. Check back soon or message them on WhatsApp!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {storeProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onSelectProduct={(p) => {
                      onClose();
                      onSelectProduct(p);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer report & terms */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <button
              onClick={() => {
                onClose();
                onOpenReport('store', store.id, store.name);
              }}
              className="text-slate-500 hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Report this store to HustleHub Campus Admins</span>
            </button>

            <button
              onClick={openTerms}
              className="text-[11px] text-slate-400 hover:text-orange-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Terms & Seller Conduct Policy →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
