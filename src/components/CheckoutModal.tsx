/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  CreditCard, 
  Sparkles, 
  Check, 
  ChevronRight, 
  ShieldCheck, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Truck, 
  Award, 
  Lock 
} from 'lucide-react';
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
  const [error, setError] = useState('');

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
    setError('');
    
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.zip) {
      setError('Please fill out all mandatory customer fields (name, phone, email, address, city, state, zip).');
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
    } catch (err: any) {
      console.error("Order submission failure:", err);
      setError(err?.message || "Error submitting order to database. Please check your network and try again.");
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
        className="w-full max-w-[512px] bg-[#030712] border border-[#dbbf64]/30 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(219,191,100,0.18)] flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#dbbf64]/10 flex items-center justify-between select-none bg-[#02050d] relative">
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-full border border-[#dbbf64]/25 flex items-center justify-center text-[#dbbf64] bg-[#dbbf64]/5">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-serif text-[11px] sm:text-xs tracking-[0.16em] text-[#ebdcb0] font-bold uppercase leading-tight">
                SECURE CHECKOUT
              </h3>
              <p className="text-[9.5px] text-zinc-400 font-sans tracking-wide leading-none mt-0.5">
                Your information is safe and encrypted
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Exquisite Mini Secret Logo */}
            <div className="flex flex-col items-center">
              <img 
                src="https://i.postimg.cc/ht7MNG1H/Chat-GPT-Image-9-06-2026-10-55-29.png" 
                alt="Secret logo" 
                className="w-9 h-9 object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]"
                referrerPolicy="no-referrer"
              />
              <span className="font-serif tracking-[0.25em] text-[6.5px] text-[#dbbf64] font-bold leading-none mt-0.5 text-center">
                SECRET
              </span>
              <span className="font-sans tracking-[0.2em] text-[5px] text-[#dbbf64]/70 leading-none text-center uppercase">
                FRAGRANCE
              </span>
            </div>

            {/* Close Button X */}
            <button 
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {placed ? (
          /* Placed Order Summary screen */
          <div className="p-8 flex-1 overflow-y-auto flex flex-col items-center justify-center text-center space-y-6 select-none bg-[#030712]">
            <div className="w-16 h-16 bg-[#dbbf64]/10 border border-[#dbbf64]/40 rounded-full flex items-center justify-center text-[#dbbf64] shadow-[0_0_20px_rgba(219,191,100,0.2)]">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="font-serif text-lg text-gold-100 font-semibold tracking-wide">
                Your Order has been logged!
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                An official summary receipt starting with ID <span className="font-mono text-gold-300">#{orderId.substring(0, 8).toUpperCase()}</span> has been saved in our real-time inventory. We redirected you to complete concierge validation on WhatsApp.
              </p>
            </div>

            <div className="p-4 bg-[#02050c] border border-[#dbbf64]/15 rounded-xl text-left text-xs w-full max-w-xs space-y-2 font-mono shadow-inner">
              <p className="text-[#dbbf64] font-bold uppercase tracking-wider text-[10px] text-center border-b border-[#dbbf64]/10 pb-1.5 mb-1 bg-[#010307]/50 p-1 rounded">Receipt Summary</p>
              <div className="flex justify-between text-zinc-400">
                <span>Ref:</span>
                <span className="text-white">#{orderId.substring(0, 12).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Client:</span>
                <span className="text-white truncate max-w-[150px]">{formData.fullName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Taxes (7%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#dbbf64] font-bold">
                <span>Final Paid:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-gradient-to-r from-[#ebdcb0] via-[#dbbf64] to-[#7f6111] hover:brightness-110 text-zinc-950 text-xs uppercase tracking-widest font-bold rounded-lg transition-all cursor-pointer"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          /* Active Checkout form screen */
          <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-[#030712]">
            
            {error && (
              <div id="checkout-error-banner" className="p-3.5 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-lg font-sans italic text-center select-none">
                {error}
              </div>
            )}

            {/* SECTION 1: CONTACT INFORMATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 select-none">
                <div className="w-8 h-8 rounded-full border border-[#dbbf64]/25 flex items-center justify-center text-[#dbbf64] bg-[#dbbf64]/5 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif text-[11px] sm:text-xs font-semibold text-[#dbbf64] tracking-[0.1em] uppercase">
                    CONTACT INFORMATION
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    Let's start with your contact details.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Full name input */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono tracking-widest uppercase text-zinc-400 font-medium">
                    FULL NAME *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-[#dbbf64]/65" />
                    </div>
                    <input
                      type="text"
                      required
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="E.g., Jonathan Santos"
                      className="w-full bg-[#050b14]/60 border border-[#dbbf64]/15 rounded-lg text-xs text-[#ebdcb0] pl-10 pr-4 py-3 placeholder-zinc-500 focus:outline-none focus:border-[#dbbf64] focus:ring-1 focus:ring-[#dbbf64]/30 transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Email & Phone grid: stacked on mobile, row on tablet/desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono tracking-widest uppercase text-zinc-400 font-medium">
                      PHONE NUMBER *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="w-4 h-4 text-[#dbbf64]/65" />
                      </div>
                      <input
                        type="tel"
                        required
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(561) 668-7361"
                        className="w-full bg-[#050b14]/60 border border-[#dbbf64]/15 rounded-lg text-xs text-[#ebdcb0] pl-10 pr-3 py-3 placeholder-zinc-500 focus:outline-none focus:border-[#dbbf64] focus:ring-1 focus:ring-[#dbbf64]/30 transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono tracking-widest uppercase text-zinc-400 font-medium">
                      EMAIL ADDRESS *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-[#dbbf64]/65" />
                      </div>
                      <input
                        type="email"
                        required
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="client@secret.com"
                        className="w-full bg-[#050b14]/60 border border-[#dbbf64]/15 rounded-lg text-xs text-[#ebdcb0] pl-10 pr-3 py-3 placeholder-zinc-500 focus:outline-none focus:border-[#dbbf64] focus:ring-1 focus:ring-[#dbbf64]/30 transition-all font-sans"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION 2: DELIVERY ADDRESS */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 select-none">
                <div className="w-8 h-8 rounded-full border border-[#dbbf64]/25 flex items-center justify-center text-[#dbbf64] bg-[#dbbf64]/5 flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif text-[11px] sm:text-xs font-semibold text-[#dbbf64] tracking-[0.15em] uppercase">
                    DELIVERY ADDRESS
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    Where should we deliver your order?
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Street address */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono tracking-widest uppercase text-zinc-400 font-medium">
                    STREET ADDRESS *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <MapPin className="w-4 h-4 text-[#dbbf64]/65" />
                    </div>
                    <input
                      type="text"
                      required
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="E.g., 200 Luxury Boulevard Suite 5"
                      className="w-full bg-[#050b14]/60 border border-[#dbbf64]/15 rounded-lg text-xs text-[#ebdcb0] pl-10 pr-4 py-3 placeholder-zinc-500 focus:outline-none focus:border-[#dbbf64] focus:ring-1 focus:ring-[#dbbf64]/30 transition-all font-sans"
                    />
                  </div>
                </div>

                {/* City & State: stacked on mobile, row on tablet/desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* City */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono tracking-widest uppercase text-zinc-400 font-medium">
                      CITY *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Building className="w-4 h-4 text-[#dbbf64]/65" />
                      </div>
                      <input
                        type="text"
                        required
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Palm Beach"
                        className="w-full bg-[#050b14]/60 border border-[#dbbf64]/15 rounded-lg text-xs text-[#ebdcb0] pl-10 pr-3 py-3 placeholder-zinc-500 focus:outline-none focus:border-[#dbbf64] focus:ring-1 focus:ring-[#dbbf64]/30 transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* State Select option exactly like reference image */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono tracking-widest uppercase text-zinc-400 font-medium">
                      STATE *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <MapPin className="w-4 h-4 text-[#dbbf64]/65" />
                      </div>
                      <select
                        required
                        name="state"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full bg-[#050b14]/65 border border-[#dbbf64]/15 rounded-lg text-xs text-[#ebdcb0] pl-10 pr-10 py-3 focus:outline-none focus:border-[#dbbf64] focus:ring-1 focus:ring-[#dbbf64]/30 transition-all appearance-none cursor-pointer font-sans"
                      >
                        <option value="" disabled className="bg-[#030712] text-zinc-500">Select state</option>
                        <option value="FL" className="bg-[#030712] text-zinc-200">FL - Florida</option>
                        <option value="NY" className="bg-[#030712] text-zinc-200">NY - New York</option>
                        <option value="CA" className="bg-[#030712] text-zinc-200">CA - California</option>
                        <option value="TX" className="bg-[#030712] text-zinc-200">TX - Texas</option>
                        <option value="SP" className="bg-[#030712] text-zinc-200">SP - São Paulo</option>
                        <option value="RJ" className="bg-[#030712] text-zinc-200">RJ - Rio de Janeiro</option>
                        <option value="MG" className="bg-[#030712] text-zinc-200">MG - Minas Gerais</option>
                        <option value="PR" className="bg-[#030712] text-zinc-200">PR - Paraná</option>
                        <option value="DF" className="bg-[#030712] text-zinc-200">DF - Distrito Federal</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        <ChevronRight className="w-4 h-4 text-[#dbbf64]/65 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zip or Postal code */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono tracking-widest uppercase text-zinc-400 font-medium">
                    ZIP / POSTAL CODE *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-medium">
                      <Mail className="w-4 h-4 text-[#dbbf64]/65" />
                    </div>
                    <input
                      type="text"
                      required
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      placeholder="33401"
                      className="w-full bg-[#050b14]/60 border border-[#dbbf64]/15 rounded-lg text-xs text-[#ebdcb0] pl-10 pr-4 py-3 placeholder-zinc-500 focus:outline-none focus:border-[#dbbf64] focus:ring-1 focus:ring-[#dbbf64]/30 transition-all font-sans"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* BUTTON ROW: THE IMPACTFUL GLORIOUS METALLIC GOLD BUTTON */}
            <div className="pt-3.5">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#ebdcb0] via-[#dbbf64] to-[#7f6111] hover:brightness-105 active:scale-[0.99] shadow-[0_4px_25px_rgba(219,191,100,0.18)] text-zinc-950 font-serif font-bold tracking-[0.15em] text-xs uppercase rounded-lg py-3.5 px-5 flex items-center justify-between transition-all cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-zinc-950 flex-shrink-0" />
                <span className="flex-1 text-center font-bold tracking-[0.14em] text-[11px] sm:text-xs text-zinc-950">
                  {loading ? "PROCESSING SECURE ORDER..." : "CONTINUE TO PAYMENT"}
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-950 flex-shrink-0" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[9.5px] text-zinc-400 mt-3 select-none text-center max-w-sm mx-auto">
                <ShieldCheck className="w-4 h-4 text-[#dbbf64] flex-shrink-0" />
                <span>Your order is securely processed and prepared for immediate dispatch.</span>
              </div>
            </div>

            {/* BOTTOM SECURE BADGES PANEL */}
            <div className="border-t border-[#dbbf64]/10 pt-4.5 mt-3 grid grid-cols-3 gap-2.5 text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border border-[#dbbf64]/20 flex items-center justify-center text-[#dbbf64] mb-1 bg-[#dbbf64]/5 shadow-[0_0_8px_rgba(219,191,100,0.05)]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="block text-[8px] font-bold tracking-wider text-[#dbbf64] uppercase leading-tight font-serif">SECURE CHECKOUT</span>
                <span className="text-[7.5px] text-zinc-500 mt-0.5 leading-none">256-bit SSL encrypted</span>
              </div>

              <div className="flex flex-col items-center border-x border-[#dbbf64]/10 px-1">
                <div className="w-8 h-8 rounded-full border border-[#dbbf64]/20 flex items-center justify-center text-[#dbbf64] mb-1 bg-[#dbbf64]/5 shadow-[0_0_8px_rgba(219,191,100,0.05)]">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="block text-[8px] font-bold tracking-wider text-[#dbbf64] uppercase leading-tight font-serif">FAST SHIPPING</span>
                <span className="text-[7.5px] text-zinc-500 mt-0.5 leading-none">Quick & reliable delivery</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border border-[#dbbf64]/20 flex items-center justify-center text-[#dbbf64] mb-1 bg-[#dbbf64]/5 shadow-[0_0_8px_rgba(219,191,100,0.05)]">
                  <Award className="w-4 h-4" />
                </div>
                <span className="block text-[8px] font-bold tracking-wider text-[#dbbf64] uppercase leading-tight font-serif">AUTHENTIC PRODUCTS</span>
                <span className="text-[7.5px] text-zinc-500 mt-0.5 leading-none">100% quality guaranteed</span>
              </div>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
