/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Trash2, Tag, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { CartItem, Coupon } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (pId: string, delta: number) => void;
  onRemoveItem: (pId: string) => void;
  onProceedToCheckout: () => void;
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  onApplyCoupon: (coupon: Coupon | null) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout,
  coupons,
  appliedCoupon,
  onApplyCoupon
}: CartDrawerProps) {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isOpen) return null;

  // Compute Subtotal
  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  // Compute Discount
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percentage") {
      discount = (subtotal * appliedCoupon.value) / 100;
    } else {
      discount = Math.min(appliedCoupon.value, subtotal);
    }
  }

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');

    if (!couponInput.trim()) return;

    const matched = coupons.find(c => c.code.trim().toUpperCase() === couponInput.trim().toUpperCase());
    if (matched) {
      onApplyCoupon(matched);
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon code.');
    }
  };

  const handleRemoveCoupon = () => {
    onApplyCoupon(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
      />

      {/* Slide-out Panel */}
      <div 
        id="cart-drawer-panel"
        className="relative w-full max-w-md bg-[#0a0907] border-l border-gold-300/15 h-full flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10"
      >
        {/* Header */}
        <div className="p-6 border-b border-gold-300/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold-500 animate-bounce" />
            <span className="font-display text-sm tracking-widest text-gold-100 uppercase font-bold">
              Your Fragrances ({cart.reduce((s, i) => s + i.quantity, 0)})
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-neutral-900 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="p-6 bg-gold-500/5 rounded-full border border-gold-300/10 text-gold-300/40">
                <ShoppingBag className="w-12 h-12" />
              </div>
              <div>
                <h4 className="font-serif text-base text-gold-300">Your bag is empty</h4>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  Discover our curated catalog of pure Arabic niche perfumery and choose your personal sillage.
                </p>
              </div>
              <button 
                onClick={onClose}
                className="mt-2 px-6 py-2 border border-gold-300/30 text-gold-300 hover:bg-gold-300 hover:text-neutral-950 text-xs uppercase tracking-wider font-semibold rounded transition-all cursor-pointer"
              >
                Start Discovering
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item.product.id}
                id={`cart-item-${item.product.id}`}
                className="flex gap-4 p-3 bg-[#11100e] border border-gold-300/10 rounded-lg hover:border-gold-300/25 transition-all"
              >
                {/* Image */}
                <div className="w-16 h-20 bg-neutral-900 rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={item.product.imageUrl} 
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Detail info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <h5 className="text-xs font-serif text-gold-100 font-medium tracking-wide line-clamp-1">
                        {item.product.name}
                      </h5>
                      <button 
                        onClick={() => onRemoveItem(item.product.id || '')}
                        className="text-zinc-500 hover:text-red-400 p-0.5 cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest">{item.product.brand}</span>
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex justify-between items-end">
                    <div className="flex items-center bg-[#181613] border border-gold-300/10 rounded">
                      <button 
                        onClick={() => onUpdateQty(item.product.id || '', -1)}
                        className="px-2.5 py-1 text-zinc-400 hover:text-white cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-[10px] font-mono text-gold-100 font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQty(item.product.id || '', 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="px-2.5 py-1 text-zinc-400 hover:text-white disabled:opacity-25 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-gold-200">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer controls */}
        {cart.length > 0 && (
          <div className="p-6 bg-[#0c0a08] border-t border-gold-300/15 space-y-4">
            
            {/* Coupon Application Form */}
            {!appliedCoupon ? (
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-gold-300/30">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="text"
                      placeholder="Coupon Code (WELCOME2026)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full bg-[#13110e] border border-gold-300/15 rounded py-2 pl-8 pr-3 text-[11px] text-gold-50 uppercase placeholder-zinc-600 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-gold-400/15 text-gold-300 border border-gold-400/30 text-[10px] tracking-wider uppercase font-semibold rounded hover:bg-gold-400 hover:text-neutral-950 transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-[9px] text-red-400 font-mono italic">{couponError}</p>
                )}
              </form>
            ) : (
              <div className="p-2.5 bg-gold-500/5 border border-gold-500/25 rounded flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gold-300">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="font-semibold tracking-wider font-mono">{appliedCoupon.code}</span>
                  <span className="text-[10px] text-gold-300/70">
                    ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}% OFF` : `$${appliedCoupon.value} OFF`})
                  </span>
                </div>
                <button 
                  onClick={handleRemoveCoupon}
                  className="text-zinc-500 hover:text-red-400 text-[10px] uppercase font-mono border-b border-dashed border-zinc-600 hover:border-red-400 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Calculations layout */}
            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-gold-400 flex-wrap items-center">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 animate-spin" />
                    Coupon Discount
                  </span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gold-300/10 pt-2 flex justify-between text-gold-300 font-display text-sm font-bold">
                <span>Est. Total</span>
                <span>${(subtotal - discount).toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              id="drawer-checkout-btn"
              onClick={onProceedToCheckout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-gold-300 to-gold-400 hover:brightness-110 text-neutral-950 tracking-wider font-bold text-xs uppercase rounded shadow-[0_4px_15px_rgba(219,191,100,0.15)] cursor-pointer"
            >
              Secure Checkout
              <ArrowRight className="w-4 h-4 animate-pulse" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
