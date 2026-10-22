import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  MapPin,
  CheckCircle2,
  ArrowLeftRight,
  ShieldAlert,
  Truck,
  Store as StoreIcon,
  Eye,
  Share2,
} from 'lucide-react';
import { Product, Store } from '../types';
import { useMarketplace } from '../context/MarketplaceContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectStore: (store: Store) => void;
  onOpenReport: (targetType: 'product' | 'store', targetId: string, title: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onSelectStore,
  onOpenReport,
}) => {
  useBodyScrollLock(Boolean(product));
  const { stores, trackWhatsAppClick, openTerms } = useMarketplace();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [customNote, setCustomNote] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  if (!product) return null;

  const store = stores.find((s) => s.id === product.storeId);

  const handleWhatsApp = () => {
    trackWhatsAppClick(product.storeId, product.id, customNote);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const conditionMap: Record<string, string> = {
    brand_new: 'Brand New (Sealed/Unused)',
    like_new: 'Like New (Mint Condition)',
    good: 'Good Condition (Gently used, fully functional)',
    fair: 'Fair (Visible signs of wear, works well)',
    service: 'Student Service / Job',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-orange-400">
              {product.category.replace('_', ' ')}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">{product.currency}{product.price}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Share listing"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6">
          
          {/* Image Showcase */}
          <div className="space-y-3">
            <div className="relative aspect-16/10 w-full bg-slate-800 rounded-xl overflow-hidden border border-slate-800">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-contain bg-black/40"
              />
              {product.isTradeable && (
                <div className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-orange-600/95 text-xs font-bold text-white shadow-md flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Open to Swap / Trade</span>
                </div>
              )}
            </div>

            {/* Thumbnail selector if multiple images */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-orange-500 scale-105'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Price Header */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {product.title}
              </h1>
              <div className="text-2xl font-black text-orange-400">
                {product.currency}{product.price}
                {product.isService && <span className="text-xs font-normal text-slate-400 ml-1">/ service</span>}
              </div>
            </div>

            {/* Condition & Stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>Condition: <strong className="text-slate-200 font-medium">{conditionMap[product.condition] || product.condition}</strong></span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-500" />
                {product.views} views
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <MessageCircle className="w-3 h-3" />
                {product.whatsappInquiries} WhatsApp inquiries
              </span>
            </div>
          </div>

          {/* Trade Details Callout */}
          {product.isTradeable && (
            <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 mb-1">
                <ArrowLeftRight className="w-4 h-4" />
                <span>Trade / Swap Preferences</span>
              </div>
              <p className="text-xs text-slate-300">
                {product.tradePreference || 'Seller is open to fair student item trades. Mention your item when texting on WhatsApp!'}
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Description & Details
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
              {product.description}
            </p>
          </div>

          {/* Student Store Card */}
          {store && (
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={store.logoUrl || '/assets/aistudio/ss_b06f2828.PNG'}
                    alt={store.name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white">{store.name}</h4>
                      {store.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400">Sold by {store.ownerName} ({store.university})</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onSelectStore(store);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 transition-colors flex items-center gap-1"
                >
                  <StoreIcon className="w-3.5 h-3.5" />
                  <span>View Store</span>
                </button>
              </div>

              {/* Location & Delivery specifics */}
              <div className="mt-3 pt-3 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{store.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{store.delivers ? (store.deliveryNotes || 'Free Campus Delivery') : 'Pick up / Meet in person'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Custom Message & WhatsApp CTA */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-medium text-slate-400">
              Add a quick note for WhatsApp (optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Can we meet near Library Quad after my 2PM lecture?"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full bg-slate-950 text-sm text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500/80 transition-all placeholder:text-slate-600"
            />

            <button
              onClick={handleWhatsApp}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Contact Student on WhatsApp ({product.storeWhatsApp})</span>
            </button>
            <p className="text-center text-[11px] text-slate-500">
              Direct peer-to-peer messaging. HustleHub does not take commissions from student sales.
            </p>
          </div>

          {/* Report Button & Terms */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <button
              onClick={() => {
                onClose();
                onOpenReport('product', product.id, product.title);
              }}
              className="text-slate-500 hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Report this listing</span>
            </button>

            <button
              onClick={openTerms}
              className="text-[11px] text-slate-400 hover:text-orange-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Terms & Campus Safety Guidelines →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
