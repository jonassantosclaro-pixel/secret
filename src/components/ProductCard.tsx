/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingCart, Eye, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: any;
  product: Product;
  onAddToCart: (p: Product) => void;
  onViewDetails: (p: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div 
      id={`product-card-${product.id}`}
      className="group relative flex flex-col rounded-lg overflow-hidden product-card-theme glass-gold-card transition-all duration-300"
    >
      {/* Product Image Frame */}
      <div className="relative aspect-[4/5] bg-neutral-900 overflow-hidden select-none">
        {/* Category tag */}
        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[9px] font-mono font-medium bg-[#0b0a08]/85 text-gold-300 rounded border border-gold-300/15 uppercase tracking-widest">
          {product.category}
        </span>

        {/* Low Stock Warning */}
        {isLowStock && (
          <span className="absolute top-3 right-3 z-10 px-2 py-0.5 text-[8px] font-bold bg-amber-500/10 text-amber-400 rounded border border-amber-500/30 uppercase tracking-widest animate-pulse">
            Only {product.stock} Left!
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center text-xs text-red-400 font-bold tracking-widest uppercase">
            Sold Out
          </span>
        )}

        {/* Shimmer sweep on card hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-400/5 to-transparent -translate-x-full group-hover:animate-shimmer z-10 pointer-events-none" />

        <img 
          src={product.imageUrl} 
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${isOutOfStock ? 'opacity-40 blur-[1px]' : ''}`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            // fallback to a lovely gradient placeholder if external URL fails
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80";
          }}
        />

        {/* Overlay hover actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2.5 z-20">
          <button
            onClick={() => onViewDetails(product)}
            className="p-3 bg-neutral-950/90 text-gold-300 hover:text-white hover:bg-gold-500 hover:text-gold-950 rounded-full border border-gold-300/20 tooltip transition-all cursor-pointer"
            title="View Fragrance Notes"
          >
            <Eye className="w-4 h-4" />
          </button>
          {!isOutOfStock && (
            <button
              onClick={() => onAddToCart(product)}
              className="p-3 bg-gold-400 text-neutral-950 hover:bg-gold-300 rounded-full transition-all cursor-pointer"
              title="Add to Shopping Bag"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 gap-2.5 select-none">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-mono tracking-widest text-gold-400 uppercase font-medium">
            {product.brand}
          </span>
          {product.brand === "Design Perfumes" && (
            <span className="text-[8px] bg-gold-500/10 text-gold-400 px-1.5 py-0.5 rounded border border-gold-400/20 flex items-center gap-0.5 tracking-tighter uppercase font-bold">
              <Sparkles className="w-2 h-2" />
              Niche
            </span>
          )}
        </div>

        <div className="flex-1">
          <h3 
            className="font-serif text-sm text-gold-100 font-medium tracking-wide group-hover:text-gold-300 transition-colors cursor-pointer"
            onClick={() => onViewDetails(product)}
          >
            {product.name}
          </h3>
          <p className="text-[11px] text-zinc-400/80 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing and Action Footer */}
        <div className="flex items-center justify-between border-t border-gold-300/10 pt-3 mt-1.5">
          <span className="font-display text-sm font-semibold text-gold-300">
            ${product.price.toFixed(2)}
          </span>
          
          {isOutOfStock ? (
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
              Out of stock
            </span>
          ) : (
            <button
              onClick={() => onAddToCart(product)}
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gold-300 hover:text-gold-950 px-3 py-1.5 border border-gold-300/25 hover:bg-gold-300 rounded transition-all cursor-pointer"
            >
              Add Bag
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
