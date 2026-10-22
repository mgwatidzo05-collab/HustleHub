import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  MapPin,
  Truck,
  MessageCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Store } from '../types';
import { useMarketplace } from '../context/MarketplaceContext';

interface FeaturedStoresSectionProps {
  onSelectStore: (store: Store) => void;
  onOpenStoreSignup: () => void;
}

export const FeaturedStoresSection: React.FC<FeaturedStoresSectionProps> = ({
  onSelectStore,
  onOpenStoreSignup,
}) => {
  const { stores, trackWhatsAppClick } = useMarketplace();

  // Featured stores that are verified and not frozen
  const featuredStores = stores.filter(
    (s) => s.isFeatured && s.isVerified && !s.isFrozen
  );

  if (featuredStores.length === 0) return null;

  return (
    <div className="my-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Featured Student Businesses
          </h2>
          <span className="text-xs text-slate-400">· Campus Spotlight</span>
        </div>
        <span className="text-xs text-amber-400/90 font-medium hidden sm:inline">
          Verified & Promoted
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {featuredStores.map((store) => (
          <div
            key={store.id}
            onClick={() => onSelectStore(store)}
            className="group relative bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/30 hover:border-amber-500/60 rounded-xl p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-lg shadow-black/20"
          >
            {/* Top row: Store Avatar & Verified Indicator */}
            <div>
              <div className="flex items-start gap-3 mb-2.5">
                <img
                  src={store.logoUrl || '/assets/aistudio/ss_b06f2828.PNG'}
                  alt={store.name}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-700/80 bg-slate-800 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                      {store.name}
                    </h3>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {store.tagline || store.description}
                  </p>
                </div>
              </div>

              {/* Location & Delivery */}
              <div className="space-y-1 text-xs text-slate-400 mb-3">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{store.location}</span>
                </div>
                {store.delivers && (
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Truck className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Campus Delivery Available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Featured
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  trackWhatsAppClick(store.id);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
