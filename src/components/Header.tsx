/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ShoppingBag, Search, User, LogOut, SlidersHorizontal, Sparkles, Settings, Instagram, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: any;
  userProfile: UserProfile | null;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleAdmin: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  currentBrand: string;
  setCurrentBrand: (val: string) => void;
  categories: string[];
}

export default function Header({
  user,
  userProfile,
  cartCount,
  onOpenCart,
  onOpenAuth,
  onLogout,
  onToggleAdmin,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  currentBrand,
  setCurrentBrand,
  categories
}: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);

  const isAdmin = user && (user.email === "secret@x.com" || userProfile?.isAdmin);

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#090806]/85 backdrop-blur-md border-b border-gold-300/15 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentBrand(""); setSelectedCategory("all"); setSearchQuery(""); }}>
            <div id="header-logo-container" className="relative w-12 h-12 rounded-full border border-gold-300/20 p-0.5 flex items-center justify-center bg-[#070605] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-400/5 to-transparent -translate-x-full animate-shimmer" />
              <img 
                src="https://i.postimg.cc/6qJnp9Ld/Chat-GPT-Image-6-06-2026-12-02-47.png" 
                alt="Secret Fragrance Logo" 
                className="w-full h-full object-contain rounded-full p-1"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-sm tracking-[0.2em] text-shimmer-gold font-extrabold select-none">SECRET</h1>
              <p className="font-display text-[9px] tracking-[0.3em] text-gold-200 select-none">FRAGRANCE</p>
            </div>
          </div>

          {/* Center search input */}
          <div className="flex-1 max-w-md mx-4 relative hidden md:block">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gold-400/50">
              <Search className="w-4 h-4" />
            </div>
            <input 
              id="header-search-bar"
              type="text"
              placeholder="Search precious fragrances..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#14120f] border border-gold-300/25 rounded-md py-2 pl-9 pr-4 text-xs text-gold-50 placeholder-gold-300/30 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 transition-all font-sans"
            />
          </div>

          {/* Right Controls Actions */}
          <div className="flex items-center gap-1.5 min-[360px]:gap-2 sm:gap-4">
            
            {/* Search Toggle button (on mobile) */}
            <button 
              id="header-search-mobile-btn"
              onClick={() => setShowSearch(!showSearch)} 
              className="p-1.5 min-[360px]:p-2 text-gold-300/80 hover:text-gold-300 md:hidden bg-transparent rounded-full border border-gold-300/10 cursor-pointer"
              title="Search"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 h-4" />
            </button>

            {/* Direct Instagram Link */}
            <a
              id="header-instagram-link"
              href="https://www.instagram.com/secretfragrance.us/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 min-[360px]:p-2 text-gold-300/80 hover:text-pink-400 bg-[#12100d] hover:bg-pink-500/10 border border-gold-300/15 hover:border-pink-500/20 rounded-full transition-all cursor-pointer flex items-center justify-center"
              title="Instagram"
            >
              <Instagram className="w-3.5 h-3.5 sm:w-4 h-4" />
            </a>

            {/* Direct WhatsApp Link */}
            <a
              id="header-whatsapp-link"
              href="https://wa.me/message/EPVGKDY5RL5FD1"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 min-[360px]:p-2 text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/45 rounded-full transition-all cursor-pointer flex items-center justify-center animate-pulse"
              style={{ animationDuration: '3s' }}
              title="WhatsApp Concierge"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 h-4" />
            </a>

            {/* Cart Badge with Bag icon */}
            <button 
              id="header-cart-btn"
              onClick={onOpenCart}
              className="relative p-1.5 min-[360px]:p-2 sm:p-2.5 text-gold-300/80 hover:text-gold-300 bg-[#12100d] hover:bg-[#1c1814] border border-gold-300/15 rounded-full transition-all cursor-pointer group"
              title="Open Shopping Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 h-4 group-hover:scale-105 transition-transform" />
              {cartCount > 0 && (
                <span id="cart-indicator-badge" className="absolute -top-1 -right-1 block w-4.5 h-4.5 min-[360px]:w-5 min-[360px]:h-5 bg-gold-500 text-gold-900 border border-[#090806] text-[9px] min-[360px]:text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin access (if qualified) */}
            {isAdmin && (
              <button 
                id="header-admin-quick-btn"
                onClick={onToggleAdmin}
                className="p-1.5 min-[360px]:p-2 sm:p-2.5 text-gold-300/80 hover:text-gold-400 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 rounded-full transition-all cursor-pointer"
                title="Admin Dashboard"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 h-4" />
              </button>
            )}

            {/* User Logged Info / Login */}
            {user ? (
              <div className="flex items-center gap-1 min-[360px]:gap-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-[10px] font-medium text-gold-100 max-w-[120px] truncate">
                    {userProfile?.fullName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[8px] tracking-wider text-gold-300/40 font-mono uppercase">
                    {isAdmin ? 'ADMIN' : 'CLIENT'}
                  </span>
                </div>
                <button
                  id="header-signout-btn"
                  onClick={onLogout}
                  className="p-1.5 min-[360px]:p-2 sm:p-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 rounded-full transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                id="header-signin-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-2 py-1.5 min-[360px]:px-3 min-[360px]:py-2 sm:px-4 sm:py-2 text-[10px] min-[360px]:text-[11px] font-medium tracking-wider text-gold-900 bg-gradient-to-r from-gold-300 to-gold-400 hover:brightness-115 rounded-md transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline uppercase">Sign In</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Search Input Row */}
        {showSearch && (
          <div className="py-3 px-1 md:hidden border-t border-gold-300/10">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gold-400/50">
                <Search className="w-4 h-4" />
              </div>
              <input 
                id="header-search-mobile-input"
                type="text"
                placeholder="Search premium perfumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#14120f] border border-gold-300/25 rounded-md py-2.5 pl-9 pr-4 text-xs text-gold-50 placeholder-gold-300/30 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Quick Horizontal categories line */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none border-t border-gold-300/10 select-none">
          <button
            onClick={() => { setSelectedCategory("all"); setCurrentBrand(""); }}
            className={`flex-shrink-0 px-3.5 py-1 text-[10px] tracking-wider uppercase rounded-full border transition-all cursor-pointer ${
              selectedCategory === "all" && currentBrand === ""
                ? "bg-gold-500 text-gold-950 border-gold-500 font-bold"
                : "bg-transparent text-gold-300/60 border-gold-300/10 hover:border-gold-300/30 hover:text-gold-200"
            }`}
          >
            All Products
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-3.5 py-1 text-[10px] tracking-wider uppercase rounded-full border transition-all cursor-pointer ${
                selectedCategory === cat 
                  ? "bg-gold-500 text-gold-950 border-gold-500 font-bold"
                  : "bg-transparent text-gold-300/60 border-gold-300/10 hover:border-gold-300/30 hover:text-gold-200"
              }`}
            >
              {cat}
            </button>
          ))}

          {currentBrand && (
            <span className="flex-shrink-0 px-3 py-1 bg-gold-900/30 border border-gold-500/30 text-gold-300 rounded-full font-mono text-[9px] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-gold-400" />
              Brand: {currentBrand}
              <button 
                onClick={() => setCurrentBrand("")} 
                className="hover:text-white font-bold ml-1 text-[9px] bg-gold-500/20 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
