/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldAlert, Phone, Mail, MapPin, Instagram, Facebook, MessageSquare, Sparkles } from 'lucide-react';
import { Socials } from '../types';

interface FooterProps {
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  socials: Socials;
  user: any;
}

export default function Footer({ onOpenAuth, onOpenAdmin, socials, user }: FooterProps) {
  
  // Format WhatsApp Link
  const waNumber = socials.whatsapp.replace(/[^\d+]/g, '');
  const waUrl = `https://wa.me/${waNumber || '15616687361'}`;

  return (
    <footer id="main-footer" className="bg-[#070605] border-t border-gold-300/15 py-12 px-4 sm:px-6 lg:px-8 mt-auto select-none">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <img 
              src="https://i.postimg.cc/ht7MNG1H/Chat-GPT-Image-9-06-2026-10-55-29.png" 
              alt="Secret Fragrance Logo" 
              className="w-13 h-13 object-contain rounded-full border border-gold-300/20 p-0.5 filter drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="font-display text-sm tracking-[0.2em] text-shimmer-gold font-bold">SECRET</h3>
              <p className="font-display text-[9px] tracking-[0.3em] text-gold-300">FRAGRANCE</p>
            </div>
          </div>
          <p className="text-xs text-gold-100/60 font-serif leading-relaxed max-w-sm">
            Specializing in direct imports of premium, 100% authentic Arabian masterpieces, sophisticated designer perfumes, and highly sought-after rare niche oils. Unveiling the sensory legacy of Eastern luxury.
          </p>
          <div className="flex items-center gap-3">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#12100d] hover:bg-emerald-500/10 border border-gold-300/10 hover:border-emerald-500/20 text-gold-300 hover:text-emerald-400 rounded-full transition-all cursor-pointer">
              <MessageSquare className="w-4 h-4" />
            </a>
            <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#12100d] hover:bg-pink-500/10 border border-gold-300/10 hover:border-pink-500/20 text-gold-300 hover:text-pink-400 rounded-full transition-all cursor-pointer">
              <Instagram className="w-4 h-4" />
            </a>
            <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#12100d] hover:bg-blue-500/10 border border-gold-300/10 hover:border-blue-500/20 text-gold-300 hover:text-blue-400 rounded-full transition-all cursor-pointer">
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Contact Info Column */}
        <div>
          <h4 className="font-display text-xs tracking-wider text-gold-300 uppercase font-semibold mb-4 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
            Concierge
          </h4>
          <ul className="space-y-3 text-xs text-gold-100/60 font-sans">
            <li className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-gold-500 flex-shrink-0 mt-0.5" />
              <span>Palm Beach County, Florida, USA</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" />
              <a href={`tel:${waNumber || '15616687361'}`} className="hover:text-gold-200 transition-colors">
                {socials.whatsapp || "+1 (561) 668-7361"}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" />
              <a href="mailto:secretfragrance.us@gmail.com" className="hover:text-gold-200 transition-colors">
                secretfragrance.us@gmail.com
              </a>
            </li>
          </ul>
        </div>

        {/* Administration and Reviewer column */}
        <div className="flex flex-col justify-between">
          <div>
            <h4 className="font-display text-xs tracking-wider text-gold-300 uppercase font-semibold mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-gold-500" />
              Management
            </h4>
            <p className="text-[10px] text-gold-300/50 font-serif leading-relaxed mb-4">
              Authorized admin access leads directly to the inventory logs, sales, coupons, and stock controls.
            </p>
            <button 
              id="footer-admin-btn"
              onClick={onOpenAdmin}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#11100e] hover:bg-gold-500/10 border border-gold-500/30 hover:border-gold-500/60 text-gold-300 hover:text-gold-400 rounded text-xs transition-all tracking-wider font-semibold cursor-pointer"
            >
              ADMIN PANEL
            </button>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-gold-300/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
        <p className="text-[10px] text-gold-300/45 font-sans">
          Secret Fragrance © 2026. All luxury collections imported directly. Genuine Arabic Craftsmanship.
        </p>
        <div className="text-[9px] text-gold-100/30 font-mono tracking-widest flex items-center gap-1.5">
          <span>SECURE PROTOCOL</span>
          <span className="w-1 h-1 bg-gold-500 rounded-full animate-pulse" />
          <span>OFFICIAL RETAILER</span>
        </div>
      </div>
    </footer>
  );
}
