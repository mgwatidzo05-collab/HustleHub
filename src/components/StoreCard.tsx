import React from 'react';
import {
  MapPin,
  CheckCircle2,
  Clock,
  Truck,
  MessageCircle,
  Sparkles,
  ShoppingBag,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { Store } from '../types';
import { useMarketplace } from '../context/MarketplaceContext';

interface StoreCardProps {
  store: Store;
  onSelectStore: (store: Store) => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  store,
  onSelectStore,
}) => {
  const { trackWhatsAppClick, trackStoreView, products } = useMarketplace();

  const storeProducts = products.filter((p) => p.storeId === store.id);

  const handleCardClick = () => {
    trackStoreView(store.id);
    onSelectStore(store);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackWhatsAppClick(store.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group bg-slate-900/80 hover:bg-slate-900 border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        store.isFrozen
          ? 'border-rose-900/50 opacity-75'
          : store.isFeatured
          ? 'border-amber-500/40 hover:border-amber-500/80'
          : 'border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Store Cover / Banner (if available) or mini header */}
      <div className="relative h-24 w-full bg-slate-800 overflow-hidden">
        {store.bannerUrl ? (
          <img
            src={store.bannerUrl}
            alt={store.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-center">
            <span className="text-2xl font-black text-slate-800 uppercase tracking-widest">
              {store.name.slice(0, 3)}
            </span>
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {store.isFrozen ? (
            <span className="px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 text-[10px] font-bold border border-rose-800 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Frozen
            </span>
          ) : store.isFeatured ? (
            <span className="px-2 py-0.5 rounded bg-amber-500/90 text-black text-[10px] font-bold flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          ) : null}

          {store.isVerified && (
            <span className="px-2 py-0.5 rounded bg-blue-500/90 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pt-0 relative flex-1 flex flex-col justify-between">
        {/* Floating Avatar */}
        <div className="flex items-end justify-between -mt-7 mb-3">
          <img
            src={store.logoUrl || '/assets/aistudio/ss_b06f2828.PNG'}
            alt={store.name}
            className="w-14 h-14 rounded-xl object-cover bg-slate-900 border-2 border-slate-900 shadow-md shadow-black/40"
          />
          <div className="text-right">
            <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-slate-200">{store.rating > 0 ? store.rating.toFixed(1) : 'New'}</span>
              <span className="text-slate-600">({store.reviewCount})</span>
            </div>
          </div>
        </div>

        <div>
          {/* Store Name & Category */}
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors truncate">
              {store.name}
            </h3>
          </div>

          <p className="text-xs text-orange-400/90 font-medium line-clamp-1 mb-2">
            {store.tagline || store.category.replace('_', ' ')}
          </p>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {store.description}
          </p>

          {/* Location & Delivery */}
          <div className="space-y-1.5 text-xs text-slate-400 mb-3">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{store.location}</span>
            </div>

            {store.delivers ? (
              <div className="flex items-center gap-1.5 text-emerald-400 truncate">
                <Truck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{store.deliveryNotes || 'Campus delivery available'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500 truncate">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Campus pickup / Walk-in</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span>{storeProducts.length} items</span>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] text-slate-500">{store.whatsappClicks} chats</span>
          </div>

          {store.isFrozen ? (
            <span className="text-xs text-rose-400 font-medium">Store Paused</span>
          ) : (
            <button
              onClick={handleWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
