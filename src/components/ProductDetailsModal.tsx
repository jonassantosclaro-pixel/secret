/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Citrus, 
  Leaf, 
  Flame, 
  Globe, 
  Lock 
} from 'lucide-react';
import { Product } from '../types';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product, qty: number) => void;
}

export default function ProductDetailsModal({ product, onClose, onAddToCart }: ProductDetailsModalProps) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.stock <= 0;

  const handleIncrement = () => {
    if (qty < product.stock) setQty(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (qty > 1) setQty(prev => prev - 1);
  };

  const handleAdd = () => {
    onAddToCart(product, qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  // Dynamically map product specifications to match the photo's structure perfectly
  const getProductSpecs = (name: string, category: string) => {
    const norm = name.toLowerCase();
    
    if (norm.includes("jean lowe") || norm.includes("summer") || norm.includes("vibes")) {
      return {
        topBadge: "NICHE",
        featureBadge: "☀️ BEST FOR HEAT",
        tag: "FRESH SUMMER",
        size: "EAU DE PARFUM • 100ML",
        notes: [
          { label: "LEMON", icon: "citrus" },
          { label: "FIG", icon: "sparkles" },
          { label: "MINT & BASIL", icon: "leaf" }
        ]
      };
    }
    
    if (norm.includes("khamrah")) {
      return {
        topBadge: "UNISEX",
        featureBadge: "🍂 WINTER COZY",
        tag: "WARM GOURMAND",
        size: "EAU DE PARFUM • 100ML",
        notes: [
          { label: "CINNAMON", icon: "flame" },
          { label: "SWEET DATES", icon: "sparkles" },
          { label: "VANILLA & MUSK", icon: "leaf" }
        ]
      };
    }
    
    if (norm.includes("yara")) {
      return {
        topBadge: "FEMININE",
        featureBadge: "🌸 SWEET SILLAGE",
        tag: "CREAMY MASTERPIECE",
        size: "EAU DE PARFUM • 100ML",
        notes: [
          { label: "ORCHID", icon: "sparkles" },
          { label: "TANGERINE", icon: "citrus" },
          { label: "CREAMY VANILLA", icon: "leaf" }
        ]
      };
    }
    
    if (norm.includes("club de nuit")) {
      return {
        topBadge: "MASCULINE",
        featureBadge: "🔥 RICH PROJECTION",
        tag: "ICONIC WOODY",
        size: "EAU DE PARFUM • 105ML",
        notes: [
          { label: "FRESH LEMON", icon: "citrus" },
          { label: "PINEAPPLE", icon: "sparkles" },
          { label: "ROYAL AMBERGRIS", icon: "leaf" }
        ]
      };
    }

    if (norm.includes("royal amber")) {
      return {
        topBadge: "NICHE",
        featureBadge: "💎 LUXURY AMBER",
        tag: "AMBERY FRUITY",
        size: "EAU DE PARFUM • 100ML",
        notes: [
          { label: "JUICY MELON", icon: "citrus" },
          { label: "SWEET PINEAPPLE", icon: "sparkles" },
          { label: "WARM AMBER BASE", icon: "leaf" }
        ]
      };
    }

    // Default premium layout matching user's exact styling structure
    const isNiche = category.toLowerCase() === 'niche';
    const isFem = category.toLowerCase() === 'feminine';
    const isMas = category.toLowerCase() === 'masculine';
    
    return {
      topBadge: category.toUpperCase(),
      featureBadge: isNiche ? "☀️ BEST FOR HEAT" : isFem ? "🌸 EXQUISITE BLEND" : isMas ? "🔥 INTENSE MASCULINE" : "✨ PREMIUM ORIGINAL",
      tag: isNiche ? "FRESH SUMMER" : "EXCLUSIVE LINE",
      size: "EAU DE PARFUM • 100ML",
      notes: [
        { label: "CITRUS ACCORDS", icon: "citrus" },
        { label: "PREMIUM SPICES", icon: "flame" },
        { label: "AMBER & WOODS", icon: "leaf" }
      ]
    };
  };

  const specs = getProductSpecs(product.name, product.category);

  const renderNoteIcon = (iconName: string) => {
    switch (iconName) {
      case 'citrus':
        return <Citrus className="w-4 h-4 text-[#dbbf64] sm:w-5 sm:h-5" />;
      case 'leaf':
        return <Leaf className="w-4 h-4 text-[#dbbf64] sm:w-5 sm:h-5" />;
      case 'flame':
        return <Flame className="w-4 h-4 text-[#dbbf64] sm:w-5 sm:h-5" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#dbbf64] sm:w-5 sm:h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
      {/* Outer Click dismiss wrapper */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Main Single Column Container - Matches photo aspect ration and scrolling structure */}
      <div 
        id={`details-modal-box-${product.id}`}
        className="relative w-full max-w-md bg-[#050e14] border border-[#dbbf64]/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(219,191,100,0.18)] max-h-[95vh] flex flex-col scrollbar-none z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Luxury Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-30 p-2 text-gold-300/75 hover:text-white bg-black/50 backdrop-blur-md border border-gold-300/10 hover:border-gold-300/30 rounded-full transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto flex-1 p-3 sm:p-4 space-y-4">
          {/* 1. White/Ivory Rounded Box for Product Image - Matches the photo EXACTLY */}
          <div className="relative w-full aspect-[4/3.8] bg-[#fbf9f6] rounded-2.5xl flex items-center justify-center p-6 shadow-[0_6px_30px_rgba(0,0,0,0.4)] overflow-hidden select-none">
            {/* Dark Category pill-badge top-left */}
            <span className="absolute top-4 left-4 z-20 px-3.5 py-1 text-[9.5px] font-mono tracking-[0.2em] font-extrabold bg-[#050e14] text-[#dbbf64] rounded-md shadow-md uppercase">
              {specs.topBadge}
            </span>

            {/* Light Gold thin border badge top-right */}
            <span className="absolute top-4 right-4 z-20 px-3 py-1 text-[8.5px] font-sans font-semibold uppercase tracking-[0.14em] rounded-full border border-[#dbbf64]/30 text-[#b5952d] bg-white/70 shadow-sm flex items-center gap-1">
              {specs.featureBadge}
            </span>

            {/* Centered High Fidelity Perfume Bottle */}
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full max-h-[82%] object-contain mix-blend-multiply transition-transform duration-700 hover:scale-[1.03]"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80";
              }}
            />

            {/* Custom Carousel slider dots at the bottom of the white card */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none">
              <span className="bg-[#dbbf64] w-2 h-2 rounded-full shadow-sm" />
              <span className="bg-zinc-300/80 w-1.5 h-1.5 rounded-full" />
              <span className="bg-zinc-300/80 w-1.5 h-1.5 rounded-full" />
              <span className="bg-zinc-300/80 w-1.5 h-1.5 rounded-full" />
            </div>
          </div>

          {/* 2. Product Information section below the Card */}
          <div className="px-1.5 pb-2 space-y-4">
            {/* Header info line: Brand & Custom Tag */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex flex-col">
                <span className="text-[10px] font-sans font-medium text-zinc-400 uppercase tracking-[0.25em]">
                  {product.brand.toUpperCase() || "ARABIAN"} PERFUMES
                </span>
              </div>
              
              {/* Sillage Leaf tag right (Matches "FRESH SUMMER" outline tag) */}
              <div className="flex-shrink-0 px-2.5 py-0.5 border border-[#dbbf64]/25 text-[#dbbf64] rounded text-[8.5px] font-mono font-bold uppercase tracking-[0.15em] flex items-center gap-1 bg-[#dbbf64]/3">
                <Leaf className="w-3 h-3 text-[#dbbf64]" />
                {specs.tag}
              </div>
            </div>

            {/* Elegant Font Title for the Product */}
            <h2 className="font-serif text-2xl sm:text-3xl text-zinc-50 font-normal tracking-wide leading-tight">
              {product.name}
            </h2>

            {/* Fluid description styling */}
            <p className="text-xs sm:text-[13px] text-zinc-300/85 leading-relaxed tracking-wide font-sans">
              {product.description}
            </p>

            {/* Custom visual olfactory icon badges - Lemon, Fig, Mint & Basil */}
            <div className="flex items-center gap-4 sm:gap-6 py-2 overflow-x-auto scrollbar-none select-none">
              {specs.notes.map((note, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[9.5px] sm:text-[10px] text-gold-200/90 font-mono tracking-widest font-bold uppercase flex-shrink-0">
                  {renderNoteIcon(note.icon)}
                  {note.label}
                </div>
              ))}
            </div>

            {/* Price section and dynamic Interactive Cart Selector & Button */}
            <div className="flex items-center justify-between gap-4 pt-3">
              {/* Product Price Tag (Left side) */}
              <div className="text-left flex flex-col justify-center">
                <span className="font-serif text-2xl sm:text-3xl text-[#dbbf64] font-medium tracking-wider">
                  {isOutOfStock ? "SOLD OUT" : `$${product.price.toFixed(2)}`}
                </span>
                <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase mt-1 block">
                  {specs.size}
                </span>
              </div>

              {/* Quantity selectors + Gold solid Action button (Right side) */}
              {!isOutOfStock ? (
                <div className="flex items-center gap-2.5 flex-1 max-w-[210px] justify-end">
                  {/* Quantity selector pills */}
                  <div className="flex items-center bg-[#07131d] border border-gold-300/10 rounded-lg py-1.5">
                    <button 
                      onClick={handleDecrement}
                      disabled={qty <= 1}
                      className="px-2.5 text-zinc-400 hover:text-white disabled:opacity-20 font-bold text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-[11px] font-bold font-mono text-gold-100">
                      {qty}
                    </span>
                    <button 
                      onClick={handleIncrement}
                      disabled={qty >= product.stock}
                      className="px-2.5 text-zinc-400 hover:text-white disabled:opacity-20 font-bold text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Bag action pill exactly matching photo */}
                  <button
                    onClick={handleAdd}
                    className="flex-1 max-w-[145px] py-3.5 px-4 bg-[#dbbf64] hover:bg-[#ebd074] text-neutral-950 text-[10px] sm:text-[10.5px] font-mono tracking-[0.16em] uppercase font-bold rounded-lg shadow-[0_4px_24px_rgba(219,191,100,0.18)] hover:shadow-[0_4px_30px_rgba(219,191,100,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {added ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        ADDED
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        ADD TO BAG
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button 
                  disabled 
                  className="px-6 py-3.5 bg-neutral-900 border border-neutral-800 text-zinc-500 rounded-lg text-[10px] font-mono tracking-widest uppercase font-semibold"
                >
                  OUT OF STOCK
                </button>
              )}
            </div>

            {/* Separator Line */}
            <div className="border-t border-zinc-800/50 pt-4" />

            {/* Trust and Safety Badges Footer - Authentic Guaranteed, Worldwide Shipping, Secure Payment */}
            <div className="grid grid-cols-3 gap-2 text-center text-[8.5px] sm:text-[9.2px] text-zinc-400/85 font-sans font-medium uppercase tracking-[0.12em] leading-relaxed select-none">
              <div className="flex flex-col items-center justify-start py-1">
                <ShieldCheck className="w-4.5 h-4.5 text-[#dbbf64] mb-1.5" />
                <span>AUTHENTIC<br />GUARANTEED</span>
              </div>
              <div className="flex flex-col items-center justify-start py-1">
                <Globe className="w-4.5 h-4.5 text-[#dbbf64] mb-1.5" />
                <span>WORLDWIDE<br />SHIPPING</span>
              </div>
              <div className="flex flex-col items-center justify-start py-1">
                <Lock className="w-4.5 h-4.5 text-[#dbbf64] mb-1.5" />
                <span>SECURE<br />PAYMENT</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

