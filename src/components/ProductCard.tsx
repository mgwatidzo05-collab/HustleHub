import React from 'react';
import {
  MessageCircle,
  MapPin,
  CheckCircle2,
  ArrowLeftRight,
  Eye,
  Camera,
  Truck,
} from 'lucide-react';
import { Product } from '../types';
import { useMarketplace } from '../context/MarketplaceContext';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
}) => {
  const { trackWhatsAppClick, trackProductView } = useMarketplace();

  const handleCardClick = () => {
    trackProductView(product.id);
    onSelectProduct(product);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackWhatsAppClick(product.storeId, product.id);
  };

  const conditionLabels: Record<string, string> = {
    brand_new: 'Brand New',
    like_new: 'Like New',
    good: 'Good Condition',
    fair: 'Fair',
    service: 'Student Service',
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Product Image Box */}
      <div className="relative aspect-4/3 w-full bg-slate-800 overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Photo Count badge if multiple */}
        {product.images.length > 1 && (
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-medium text-slate-200 flex items-center gap-1">
            <Camera className="w-3 h-3" />
            <span>{product.images.length}</span>
          </div>
        )}

        {/* Trade Available indicator */}
        {product.isTradeable && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-orange-600/90 backdrop-blur-sm text-[10px] font-semibold text-white flex items-center gap-1 shadow-sm">
            <ArrowLeftRight className="w-3 h-3" />
            <span>Open to Trade</span>
          </div>
        )}

        {/* Price Tag overlay */}
        <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-md text-white font-black text-sm tracking-tight border border-white/10 shadow-md">
          {product.currency}{product.price}
          {product.isService && <span className="text-[10px] font-normal text-slate-300 ml-0.5">/job</span>}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata: Category & Condition (Zero-Pill clean typography) */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5">
            <span className="capitalize">{product.category.replace('_', ' ')}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{conditionLabels[product.condition] || product.condition}</span>
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-semibold text-slate-100 group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug mb-2">
            {product.title}
          </h3>

          {/* Store Info */}
          <div className="space-y-1 text-xs text-slate-400 mb-3">
            <div className="flex items-center gap-1 font-medium text-slate-300 truncate">
              <span className="truncate">{product.storeName}</span>
              {product.storeIsVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">{product.storeLocation}</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA Row: Inquiries count & WhatsApp direct order */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{product.views} views</span>
          </div>

          <button
            onClick={handleWhatsAppClick}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Chat directly on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
