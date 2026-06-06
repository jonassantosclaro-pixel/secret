/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { X, ShoppingBag, Check, ShieldCheck, Heart, Sparkles } from 'lucide-react';
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

  // Generate mock olfactive accords based on name to enrich luxury vibe
  const getAccords = (name: string) => {
    switch(name) {
      case "Khamrah":
        return ["Warm Cinnamon", "Sweet Dates", "Creamy Praline", "Amberwood", "Vanilla Extract"];
      case "9PM Intense":
        return ["Wild Lavender", "Crisp Green Apple", "Fiery Cardamon", "Rich Amber", "Sandalwood"];
      case "Club de Nuit Intense Man":
        return ["Fresh Lemon", "Pineapple Accord", "Birch Tar", "Royal Ambergris", "Pure Patchouli"];
      case "Yara Rose":
        return ["Powdered Orchid", "Summer Tangerine", "Creamy Milk", "Soft Musk", "Warm Sandalwood"];
      case "Royal Amber":
        return ["Juicy Melon", "Fresh Pineapple", "Warm Amber", "Sensual Musk", "Ozone Accord"];
      case "Golden Elixir Imperial":
        return ["Cambodian Oud", "Taif Rose", "Honey Tobacco", "Iranian Saffron", "White Musk"];
      default:
        return ["Premium Spices", "Warm Woody Accords", "Rich Musk", "Amber Base", "Essential Oils"];
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="details-modal-box"
        className="relative w-full max-w-4xl bg-[#0b0a08] border border-gold-300/20 rounded-xl overflow-hidden shadow-[0_0_80px_rgba(219,191,100,0.15)] grid grid-cols-1 md:grid-cols-2"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-gold-300/60 hover:text-white bg-[#0e0d0b] border border-gold-300/10 hover:border-gold-300/30 rounded-full transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Product Image Column */}
        <div className="relative aspect-[4/5] md:aspect-auto bg-neutral-950 flex items-center justify-center overflow-hidden">
          {/* Radial auric light background */}
          <div className="absolute w-80 h-80 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover md:h-full md:absolute md:inset-0"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80";
            }}
          />

          {/* Luxury Floating Details */}
          <span className="absolute bottom-4 left-4 z-10 px-3 py-1 text-[9px] font-mono tracking-widest bg-black/80 text-gold-300 border border-gold-300/10 rounded uppercase">
            {product.category}
          </span>
        </div>

        {/* Right Side: Product Details Column */}
        <div className="p-6 sm:p-8 flex flex-col justify-between gap-6 overflow-y-auto max-h-[85vh] md:max-h-none">
          <div className="space-y-4">
            
            {/* Brand Header */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-mono font-medium text-gold-400 uppercase tracking-[0.25em]">
                {product.brand}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
              <span className="text-[9px] text-gold-200/50 uppercase tracking-widest font-sans font-semibold">
                Imported Arabic Original
              </span>
            </div>

            {/* Title & Price */}
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl text-gold-50 font-medium tracking-wide">
                {product.name}
              </h2>
              <p className="font-display text-xl font-bold text-gold-300 mt-2">
                ${product.price.toFixed(2)}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-gold-200/60 font-semibold">
                The Heritage
              </h4>
              <p className="text-xs text-zinc-300 font-serif leading-relaxed italic">
                "{product.description}"
              </p>
            </div>

            {/* Olfactive Accords Badges */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-gold-200/60 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-gold-500" />
                Olfactive Sillage
              </h4>
              <div className="flex flex-wrap gap-2">
                {getAccords(product.name).map((accord, idx) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 bg-[#151310] border border-gold-300/15 text-gold-200 rounded font-mono text-[9px] tracking-wider uppercase"
                  >
                    {accord}
                  </span>
                ))}
              </div>
            </div>

            {/* Quality seal */}
            <div className="flex items-center gap-2 py-3 px-4 bg-[#110f0c] border border-gold-500/10 rounded-md">
              <ShieldCheck className="w-5 h-5 text-gold-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-[10px] font-semibold text-gold-300 tracking-wide uppercase">100% Authentic Certified</p>
                <p className="text-[9px] text-zinc-500">Shipped original direct from official Arabian houses.</p>
              </div>
            </div>

          </div>

          {/* Actions & Quantity selectors */}
          <div className="border-t border-gold-300/10 pt-5 space-y-4">
            
            {/* Inventory Count Indicator */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 uppercase tracking-widest">Availability:</span>
              {isOutOfStock ? (
                <span className="text-red-400 uppercase font-semibold">OUT OF STOCK</span>
              ) : (
                <span className="text-emerald-400 uppercase font-semibold">
                  {product.stock <= 5 ? `CRITICAL LIMIT - ONLY ${product.stock} LEFT` : 'IN STOCK'}
                </span>
              )}
            </div>

            {/* Quantity adjustment & Add row */}
            {!isOutOfStock ? (
              <div className="flex items-center gap-4">
                {/* Selector */}
                <div className="flex items-center bg-[#13110e] border border-gold-300/20 rounded">
                  <button 
                    onClick={handleDecrement}
                    disabled={qty <= 1}
                    className="px-3.5 py-2 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-semibold font-mono text-gold-100">
                    {qty}
                  </span>
                  <button 
                    onClick={handleIncrement}
                    disabled={qty >= product.stock}
                    className="px-3.5 py-2 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Add button */}
                <button
                  id="details-add-to-cart-btn"
                  onClick={handleAdd}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-gold-300 to-gold-400 hover:brightness-110 text-neutral-950 text-xs tracking-wider uppercase font-bold rounded shadow-[0_4px_15px_rgba(219,191,100,0.2)] transition-all cursor-pointer"
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      Added to Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      Add to Shopping Bag
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button 
                disabled 
                className="w-full py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded text-xs tracking-wider uppercase font-semibold"
              >
                Permanently Out of Stock
              </button>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
