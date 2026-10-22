import React from 'react';
import {
  BookOpen,
  Laptop,
  Home,
  Scissors,
  Sparkles,
  Printer,
  Shirt,
  GraduationCap,
  Wrench,
  Layers,
  ArrowLeftRight,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { StoreCategory } from '../types';
import { useMarketplace } from '../context/MarketplaceContext';

interface CategoryFilterBarProps {
  viewMode: 'products' | 'stores';
  setViewMode: (mode: 'products' | 'stores') => void;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  viewMode,
  setViewMode,
}) => {
  const {
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
  } = useMarketplace();

  const categories: { id: StoreCategory | 'all'; label: string; icon: React.FC<{ className?: string }> }[] = [
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

  return (
    <div className="space-y-3 py-2">
      {/* Top row: View Mode Toggle & Quick Feature Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* View Mode Segmented Control */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode('products')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === 'products'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Products & Listings
          </button>
          <button
            onClick={() => setViewMode('stores')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === 'stores'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Verified Stores & Services
          </button>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setFilterFeaturedOnly(!filterFeaturedOnly)}
            className={`px-2.5 py-1.5 rounded-lg font-medium border flex items-center gap-1.5 transition-colors ${
              filterFeaturedOnly
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured Hustles</span>
          </button>

          <button
            onClick={() => setFilterVerifiedOnly(!filterVerifiedOnly)}
            className={`px-2.5 py-1.5 rounded-lg font-medium border flex items-center gap-1.5 transition-colors ${
              filterVerifiedOnly
                ? 'bg-blue-500/15 border-blue-500/50 text-blue-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified Only</span>
          </button>

          <button
            onClick={() => setFilterDeliversOnly(!filterDeliversOnly)}
            className={`px-2.5 py-1.5 rounded-lg font-medium border flex items-center gap-1.5 transition-colors ${
              filterDeliversOnly
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Campus Delivery</span>
          </button>

          {viewMode === 'products' && (
            <button
              onClick={() => setFilterTradesOnly(!filterTradesOnly)}
              className={`px-2.5 py-1.5 rounded-lg font-medium border flex items-center gap-1.5 transition-colors ${
                filterTradesOnly
                  ? 'bg-orange-500/15 border-orange-500/50 text-orange-400'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Trades / Swaps</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Category Scroller */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-slate-800 text-orange-400 border-orange-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
