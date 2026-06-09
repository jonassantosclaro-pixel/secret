/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Trash2, Tag, ShoppingBag, ArrowRight, Sparkles, ShieldCheck, Truck, Award } from 'lucide-react';
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
        className="relative w-full max-w-md bg-[#030712] border-l border-gold-300/15 h-full flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10"
      >
        {/* Header */}
        <div className="p-6 border-b border-gold-300/10 flex items-center justify-between bg-[#02050d]">
          <div className="flex items-center gap-3 select-none">
            {/* Custom luxurious medallion/star badge */}
            <div className="w-8 h-8 rounded-full border border-gold-400/25 flex items-center justify-center text-gold-400 bg-gold-400/5 shadow-[0_0_8px_rgba(219,191,100,0.1)]">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <span className="font-serif text-xs tracking-[0.15em] text-gold-100 uppercase font-bold">
              YOUR FRAGRANCES ({cart.reduce((s, i) => s + i.quantity, 0)})
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-[#030712]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="p-6 bg-[#dbbf64]/5 rounded-full border border-[#dbbf64]/10 text-[#dbbf64]/40">
                <ShoppingBag className="w-12 h-12" />
              </div>
              <div>
                <h4 className="font-serif text-base text-[#ebdcb0]">Your bag is empty</h4>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  Discover our curated catalog of pure Arabic niche perfumery and choose your personal sillage.
                </p>
              </div>
              <button 
                onClick={onClose}
                className="mt-2 px-6 py-2 border border-[#dbbf64]/30 text-[#ebdcb0] hover:bg-[#dbbf64]/10 text-xs uppercase tracking-wider font-semibold rounded-lg transition-all cursor-pointer"
              >
                Start Discovering
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item.product.id}
                id={`cart-item-${item.product.id}`}
                className="flex gap-4 p-4 bg-[#0e1320]/40 border border-[#dbbf64]/10 rounded-2xl hover:border-[#dbbf64]/20 transition-all relative"
              >
                {/* Image */}
                <div className="w-20 h-24 bg-[#02050c] rounded-xl overflow-hidden flex-shrink-0 border border-[#dbbf64]/10">
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
                      <h5 className="text-sm font-sans font-medium text-white tracking-wide line-clamp-1 mt-0.5">
                        {item.product.name}
                      </h5>
                      <button 
                        onClick={() => onRemoveItem(item.product.id || '')}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-[#dbbf64] uppercase tracking-widest font-bold block mt-0.5">{item.product.brand}</span>
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center bg-[#050b14] border border-[#dbbf64]/15 rounded-lg py-1 px-1.5 select-none">
                      <button 
                        onClick={() => onUpdateQty(item.product.id || '', -1)}
                        className="px-2 py-0.5 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-xs font-mono text-white font-semibold">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQty(item.product.id || '', 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="px-2 py-0.5 text-zinc-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer text-xs font-semibold"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-[#ebdcb0] font-mono">
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
          <div className="p-6 bg-[#02050d] border-t border-gold-300/15 space-y-4">
            
            {/* Coupon Application Form */}
            {!appliedCoupon ? (
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gold-300/30">
                      <Tag className="w-4 h-4 text-[#dbbf64]/50" />
                    </div>
                    <input 
                      type="text"
                      placeholder="COUPON CODE (WELCOME2026)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full bg-[#050b14]/60 border border-[#dbbf64]/15 rounded-lg text-xs text-[#ebdcb0] pl-10 pr-3 py-3 placeholder-zinc-500 font-mono tracking-wider focus:outline-none focus:border-[#dbbf64]"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 border border-[#dbbf64]/40 bg-transparent text-[#dbbf64] hover:bg-[#dbbf64]/10 text-xs font-semibold uppercase tracking-widest rounded-lg transition-all cursor-pointer font-sans"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-[10px] text-red-400 font-mono italic select-none pl-1">{couponError}</p>
                )}
              </form>
            ) : (
              <div className="p-3 bg-gold-500/5 border border-[#dbbf64]/25 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gold-300">
                  <Tag className="w-3.5 h-3.5 text-[#dbbf64]" />
                  <span className="font-semibold tracking-wider font-mono text-[#ebdcb0]">{appliedCoupon.code}</span>
                  <span className="text-[10px] text-zinc-400">
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

            {/* Calculations layout styled perfectly */}
            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between text-zinc-400 select-none">
                <span>Subtotal</span>
                <span className="font-mono text-zinc-200">${subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-[#dbbf64] flex-wrap items-center">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 animate-spin" />
                    Coupon Discount
                  </span>
                  <span className="font-mono">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-[#dbbf64]/10 pt-2 flex justify-between items-center text-[#dbbf64] font-display text-sm font-bold">
                <span className="font-serif tracking-widest text-[#dbbf64] text-[11px] uppercase select-none">Est. Total</span>
                <span className="text-lg text-[#ebdcb0] font-mono font-bold tracking-wide">${(subtotal - discount).toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout CTA styled to match reference */}
            <button
              id="drawer-checkout-btn"
              onClick={onProceedToCheckout}
              className="w-full bg-gradient-to-r from-[#ebdcb0] via-[#dbbf64] to-[#7f6111] hover:brightness-105 active:scale-[0.99] text-zinc-950 font-sans font-bold tracking-[0.12em] text-xs uppercase rounded-lg py-3.5 px-5 flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(219,191,100,0.18)] cursor-pointer transition-all"
            >
              Secure Checkout
              <ArrowRight className="w-4 h-4 text-zinc-950 flex-shrink-0" />
            </button>

            {/* Bottom inline badges precisely like Image 2 */}
            <div className="border-t border-[#dbbf64]/10 pt-3 flex justify-around text-center text-[8.5px] font-mono tracking-wider text-zinc-400 uppercase select-none">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-[#dbbf64]" /> Secure Checkout</span>
              <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-[#dbbf64]" /> Fast Shipping</span>
              <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-[#dbbf64]" /> 100% Authentic</span>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
