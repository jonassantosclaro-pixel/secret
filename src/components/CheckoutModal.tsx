/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, CreditCard, Sparkles, Check, ChevronRight } from 'lucide-react';
import { CartItem, Coupon, OrderItem } from '../types';

interface CheckoutModalProps {
  onClose: () => void;
  cart: CartItem[];
  appliedCoupon: Coupon | null;
  user: any;
  userProfile: any;
  onClearCart: () => void;
  onPlaceOrderInFirestore: (orderData: any) => Promise<string>;
}

export default function CheckoutModal({
  onClose,
  cart,
  appliedCoupon,
  user,
  userProfile,
  onClearCart,
  onPlaceOrderInFirestore
}: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || '',
    email: user?.email || '',
    phone: userProfile?.phone || '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [placed, setPlaced] = useState(false);
  const [routingChannel, setRoutingChannel] = useState<'whatsapp' | 'sms'>('whatsapp');

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        fullName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        email: user?.email || ''
      }));
    }
  }, [userProfile, user]);

  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  // Discount
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percentage") {
      discount = (subtotal * appliedCoupon.value) / 100;
    } else {
      discount = Math.min(appliedCoupon.value, subtotal);
    }
  }

  // Tax calculation (7% separate)
  const tax = (subtotal - discount) * 0.07;
  const total = subtotal - discount + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      alert('Please fill out all mandatory customer fields.');
      return;
    }

    setLoading(true);

    try {
      // 1. Prepare Order Item Models
      const orderItems: OrderItem[] = cart.map(item => ({
        productId: item.product.id || '',
        name: item.product.name,
        brand: item.product.brand,
        price: item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl
      }));

      const newOrder = {
        customerName: formData.fullName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerAddress: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`,
        items: orderItems,
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        total: Number(total.toFixed(2)),
        couponCode: appliedCoupon ? appliedCoupon.code : 'NONE',
        status: 'pending',
        createdAt: new Date()
      };

      // 2. Submit to Firestore (decrease stock & push order)
      const id = await onPlaceOrderInFirestore(newOrder);
      setOrderId(id);
      
      // 3. Format message and trigger selected redirection channel
      triggerRoutingMessage(newOrder, id, routingChannel);

      setPlaced(true);
      onClearCart();
    } catch (error) {
      console.error("Order submission failure:", error);
      alert("Error submitting order to database. Please check console.");
    } finally {
      setLoading(false);
    }
  };

  const triggerRoutingMessage = (order: any, computedId: string, channel: 'whatsapp' | 'sms') => {
    const brandHeader = "🕌 *SECRET FRAGRANCE - LUXURY PARFUMERIE ORDER* 🕌";
    const spacer = "------------------------------------------------";
    
    // Order info
    const customerInfo = `*CONCIERGE DELIVERY DETAILS:*
👤 *Client:* ${order.customerName}
📞 *Phone:* ${order.customerPhone}
📧 *Email:* ${order.customerEmail}
📍 *Address:* ${order.customerAddress}`;

    // Itemized list
    const itemsList = order.items.map((it: any) => {
      return `• *${it.name}* (By ${it.brand})\n  └─ Quantity: ${it.quantity} x $${it.price.toFixed(2)} = *$${(it.quantity * it.price).toFixed(2)}*`;
    }).join('\n\n');

    // Math calculation summary
    const pricingSummary = `⚙️ *BREAKDOWN MATRICES:*
💵 Subtotal: *$${order.subtotal.toFixed(2)}*
🏷️ Coupon applied: ${order.couponCode} (-$${order.discount.toFixed(2)})
⚖️ Estimated Tax (7%): *$${order.tax.toFixed(2)}*
💎 *Grand Total:* *$${order.total.toFixed(2)}*`;

    const instructions = `⚜️ _Order generated under ID: #${computedId.substring(0, 8).toUpperCase()}_ \n\n*Please process my secure payment details and prompt scheduling!*`;

    const rawMessage = `${brandHeader}\n${spacer}\n${customerInfo}\n${spacer}\n*PERFUMES ORDERED:*\n\n${itemsList}\n${spacer}\n${pricingSummary}\n${spacer}\n${instructions}`;
    
    const encodedMessage = encodeURIComponent(rawMessage);
    
    if (channel === 'whatsapp') {
      const waUrl = `https://wa.me/message/EPVGKDY5RL5FD1?text=${encodedMessage}`;
      window.open(waUrl, '_blank');
    } else {
      // SMS / text message to +1 (561) 668-7361
      let smsUrl = `sms:+15616687361`;
      
      const ua = navigator.userAgent.toLowerCase();
      if (ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1) {
        smsUrl = `sms:+15616687361&body=${encodedMessage}`;
      } else {
        smsUrl = `sms:+15616687361?body=${encodedMessage}`;
      }
      
      // Attempt clipboard as redundancy/fallback
      try {
        navigator.clipboard.writeText(rawMessage);
      } catch (err) {
        console.warn("Could not copy order summary automatically: ", err);
      }
      
      window.open(smsUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div 
        id="checkout-dialog-box"
        className="w-full max-w-4xl bg-[#090806] border border-gold-300/20 rounded-xl overflow-hidden shadow-[0_0_80px_rgba(219,191,100,0.15)] flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-gold-300/10 flex items-center justify-between select-none bg-[#0d0c0a]">
          <h3 className="font-display text-sm sm:text-base tracking-widest text-[#f5ebd0] font-bold uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-500 animate-spin" />
            Concierge Checkout Panel
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#151412] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {placed ? (
          /* Placed Order Summary screen */
          <div className="p-8 flex-1 overflow-y-auto flex flex-col items-center justify-center text-center space-y-6 select-none bg-[#090806]">
            <div className="w-16 h-16 bg-gold-400/15 border border-gold-300/40 rounded-full flex items-center justify-center text-gold-400">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="font-serif text-xl text-gold-100 font-semibold tracking-wide">
                Your Order has been logged!
              </h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                An official summary receipt starting with ID <span className="font-mono text-gold-300">#{orderId.substring(0, 8).toUpperCase()}</span> has been saved in our real-time inventory. We redirected you to complete scheduling via {routingChannel === 'whatsapp' ? 'WhatsApp message' : 'SMS / Text message'}.
              </p>
            </div>

            <div className="p-4 bg-[#11100d] border border-gold-500/10 rounded-md text-left text-xs max-w-sm space-y-2 font-mono">
              <p className="text-gold-300 font-bold uppercase tracking-wider text-[10px] text-center border-b border-gold-500/10 pb-1.5 mb-1 bg-[#151412] p-1">Receipt Summary</p>
              <div className="flex justify-between text-zinc-400">
                <span>Ref:</span>
                <span className="text-white">#{orderId.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Client:</span>
                <span className="text-white">{formData.fullName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Taxes (7%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gold-300 font-bold">
                <span>Final Paid:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-gradient-to-r from-gold-300 to-gold-400 hover:brightness-110 text-neutral-950 text-xs uppercase tracking-widest font-bold rounded transition-all cursor-pointer"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          /* Active Checkout form screen */
          <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2">
            
            {/* Left Column: Form data inputs */}
            <div className="p-6 sm:p-8 space-y-6 border-b md:border-b-0 md:border-r border-gold-300/10 select-none">
              <div className="space-y-1">
                <h4 className="text-[10px] font-mono tracking-widest text-gold-400 uppercase font-semibold">
                  Step 1
                </h4>
                <p className="font-serif text-lg text-gold-100">Concierge Shipping Info</p>
              </div>

              <div className="space-y-4">
                {/* Full name input */}
                <div>
                  <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="E.g., Jonathan Santos"
                    className="w-full bg-[#13110e] border border-gold-300/15 text-xs text-gold-100 rounded p-3 focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone input */}
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (561) 668-7361"
                      className="w-full bg-[#13110e] border border-gold-300/15 text-xs text-gold-100 rounded p-3 focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  {/* Email input */}
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400 mb-1.5">
                      Email address *
                    </label>
                    <input
                      type="email"
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="client@secret.com"
                      className="w-full bg-[#13110e] border border-gold-300/15 text-xs text-gold-100 rounded p-3 focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>

                {/* Shipping address input */}
                <div>
                  <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400 mb-1.5">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="E.g., 200 luxury boulevard suite 5"
                    className="w-full bg-[#13110e] border border-gold-300/15 text-xs text-gold-100 rounded p-3 focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Palm Beach"
                      className="w-full bg-[#13110e] border border-gold-300/15 text-xs text-gold-100 rounded p-3 focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400 mb-1.5">
                      State / Prov
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="FL"
                      className="w-full bg-[#13110e] border border-gold-300/15 text-xs text-gold-100 rounded p-3 focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  {/* Zip Code */}
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400 mb-1.5">
                      Zip / Postal
                    </label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      placeholder="33401"
                      className="w-full bg-[#13110e] border border-gold-300/15 text-xs text-gold-100 rounded p-3 focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-zinc-500 italic">
                  * All orders are structured securely and routed immediately to the concierge team. Payment methods are processed dynamically on WhatsApp.
                </div>
              </div>
            </div>

            {/* Right Column: Order summary and pricing breakdown */}
            <div className="p-6 sm:p-8 flex flex-col justify-between bg-[#0b0a08] select-none">
              
              <div className="space-y-6">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-mono tracking-widest text-gold-400 uppercase font-semibold">
                    Step 2
                  </h4>
                  <p className="font-serif text-lg text-gold-100">Review Itemized summary</p>
                </div>

                {/* List items in checkout */}
                <div className="space-y-3.5 divide-y divide-gold-300/5 max-h-[25vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-3 pt-3 first:pt-0">
                      <div className="w-10 h-12 rounded bg-neutral-900 border border-gold-300/10 overflow-hidden flex-shrink-0">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 text-xs">
                        <h5 className="font-serif text-zinc-300 truncate font-medium">{item.product.name}</h5>
                        <div className="flex justify-between text-zinc-500 font-mono text-[9px] uppercase mt-1">
                          <span>{item.quantity} x ${item.product.price.toFixed(2)}</span>
                          <span className="text-gold-200">${(item.quantity * item.product.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Math breakdown */}
                <div className="border-t border-gold-300/10 pt-4 space-y-2.5 text-xs font-sans">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-gold-400 font-medium">
                      <span>Promo Coupon Applied ({appliedCoupon.code})</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Mandated separate 7% sales tax */}
                  <div className="flex justify-between text-zinc-400">
                    <span>Estimated Sales Tax (7%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-gold-300/15 pt-3.5 flex justify-between text-lg text-gold-300 font-display font-semibold select-none">
                    <span>Final Tally</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Routing preference channel selector */}
                <div className="space-y-2 mt-4 pt-4 border-t border-gold-300/10">
                  <span className="block text-[9px] font-mono tracking-wider uppercase text-gold-400 font-semibold select-none">
                    Preferência de Envio / Support Route
                  </span>
                  <div className="grid grid-cols-2 gap-3 mt-1.5 font-sans">
                    <button
                      type="button"
                      onClick={() => setRoutingChannel('whatsapp')}
                      className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                        routingChannel === 'whatsapp'
                          ? 'bg-emerald-500/10 border-emerald-505 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'bg-[#12110e] border-gold-300/10 text-zinc-400 hover:border-gold-300/30'
                      }`}
                    >
                      <span className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                        WhatsApp
                      </span>
                      <span className="text-[8px] font-mono text-zinc-500 mt-0.5">wa.me/message</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setRoutingChannel('sms')}
                      className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                        routingChannel === 'sms'
                          ? 'bg-amber-500/10 border-amber-505 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : 'bg-[#12110e] border-gold-300/10 text-zinc-400 hover:border-gold-300/30'
                      }`}
                    >
                      <span className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        SMS / Texto
                      </span>
                      <span className="text-[8px] font-mono text-zinc-500 mt-0.5">+1 (561) 668-7361</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action submit */}
              <div className="pt-6 border-t border-gold-300/10 mt-6 lg:mt-0">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 text-white tracking-widest text-xs uppercase font-extrabold rounded transition-all cursor-pointer disabled:opacity-40 hover:brightness-110 active:scale-[0.98] ${
                    routingChannel === 'whatsapp'
                      ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 shadow-[0_4px_25px_rgba(16,185,129,0.25)]'
                      : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 shadow-[0_4px_25px_rgba(245,158,11,0.25)]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  {loading 
                    ? 'Processando...' 
                    : routingChannel === 'whatsapp' 
                      ? 'Finalizar e Enviar via WhatsApp' 
                      : 'Finalizar e Enviar via SMS (Texto)'
                  }
                </button>
              </div>

            </div>

          </form>
        )}
      </div>
    </div>
  );
}
