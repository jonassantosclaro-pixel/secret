/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SlidersHorizontal, ArrowDown, Sparkles, ShieldCheck, 
  ChevronRight, AlertCircle, ShoppingBag, Eye, Heart
} from 'lucide-react';

// Import Custom Modular Components
import SplashIntro from './components/SplashIntro';
import Header from './components/Header';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import ProductDetailsModal from './components/ProductDetailsModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';

// Import Types and Firebase SDK
import { auth, db, handleFirestoreError } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, onSnapshot, doc, getDoc, addDoc, updateDoc, 
  query, orderBy, writeBatch, increment, Timestamp 
} from 'firebase/firestore';
import { Product, Brand, Coupon, Socials, CartItem, UserProfile, OperationType } from './types';
import { OFFICIAL_BRANDS } from './constants/brands';

export default function App() {
  // 1. Initial Launch state
  const [showSplash, setShowSplash] = useState(true);

  // 2. Core Collections State
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>(OFFICIAL_BRANDS);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [socials, setSocials] = useState<Socials>({
    whatsapp: "+1 (561) 668-7361",
    instagram: "https://instagram.com/secretfragranceloop",
    facebook: "https://facebook.com/secretfragrancestore",
    tiktok: "https://tiktok.com/@secretfragrance"
  });

  // 3. User & Auth state
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // 4. Cart & Promo code State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // 5. Active search & Filter properties
  const [currentBrand, setCurrentBrand] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 6. Component Panel Toggle states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  // Load cart from LocalStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('secret_fragrance_luxury_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.warn("Could not retrieve cart data:", e);
    }
  }, []);

  // Save cart to LocalStorage whenever altered
  useEffect(() => {
    try {
      localStorage.setItem('secret_fragrance_luxury_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn("Could not persist cart data:", e);
    }
  }, [cart]);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load User Profile from Firestore users
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Generate basic local profile fallback
            setUserProfile({
              uid: currentUser.uid,
              fullName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Member',
              email: currentUser.email || '',
              phone: '',
              isAdmin: currentUser.email === 'secret@x.com'
            });
          }
        } catch (err) {
          console.error("Error reading authenticated user profile info:", err);
        }
      } else {
        setUserProfile(null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Sync products in real-time
  useEffect(() => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(prods);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    return () => unsubscribe();
  }, []);

  // Sync brands in real-time
  useEffect(() => {
    const brandsRef = collection(db, 'brands');
    const q = query(brandsRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bnds: Brand[] = [];
      snapshot.forEach((doc) => {
        bnds.push({ id: doc.id, ...doc.data() } as Brand);
      });
      
      // Dynamic merge of database records and official local catalog definitions
      const merged: Brand[] = [];
      const officialMap = new Map<string, Brand>();
      
      OFFICIAL_BRANDS.forEach(ob => {
        officialMap.set(ob.name.toLowerCase().trim(), ob);
      });

      bnds.forEach(b => {
        const key = b.name.toLowerCase().trim();
        const official = officialMap.get(key);
        if (official) {
          // Override name and logoUrl with high-quality official specifications
          merged.push({
            ...b,
            name: official.name,
            logoUrl: official.logoUrl
          });
        } else {
          merged.push(b);
        }
      });

      // Insert any brands defined officially that aren't yet in Firestore
      OFFICIAL_BRANDS.forEach(ob => {
        const key = ob.name.toLowerCase().trim();
        const alreadyAdded = bnds.some(b => b.name.toLowerCase().trim() === key);
        if (!alreadyAdded) {
          merged.push(ob);
        }
      });
      
      // Keep lists alphabetically ordered for uniform storefront vitrina
      merged.sort((a, b) => a.name.localeCompare(b.name));
      setBrands(merged);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'brands');
    });

    return () => unsubscribe();
  }, []);

  // Sync coupons in real-time
  useEffect(() => {
    const couponsRef = collection(db, 'coupons');
    
    const unsubscribe = onSnapshot(couponsRef, (snapshot) => {
      const cps: Coupon[] = [];
      snapshot.forEach((doc) => {
        cps.push({ id: doc.id, ...doc.data() } as Coupon);
      });
      setCoupons(cps);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'coupons');
    });

    return () => unsubscribe();
  }, []);

  // Sync social links globally in real-time
  useEffect(() => {
    const socialsRef = doc(db, 'socials', 'global');
    
    const unsubscribe = onSnapshot(socialsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSocials(docSnap.data() as Socials);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'socials/global');
    });

    return () => unsubscribe();
  }, []);

  // ----------------------------------------------------
  // CART ACTIONS & STATE TRIGGERS
  // ----------------------------------------------------
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx > -1) {
        const currentQty = prev[existingIdx].quantity;
        const newQty = Math.min(product.stock, currentQty + quantity);
        const updated = [...prev];
        updated[existingIdx] = { ...prev[existingIdx], quantity: newQty };
        return updated;
      } else {
        return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
      }
    });

    setIsCartOpen(true); // Open Drawer for premium user visual cue
  };

  const handleUpdateQty = (pId: string, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.product.id === pId) {
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          const cappedQty = Math.min(item.product.stock, nextQty);
          return { ...item, quantity: cappedQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (pId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== pId));
  };

  const handleClearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setIsAdminOpen(false);
    alert('Logged out securely from Secret Fragrance.');
  };

  const handleOpenAdminPanel = () => {
    const isUserAdmin = user && (user.email === 'secret@x.com' || userProfile?.isAdmin);
    if (isUserAdmin) {
      setIsAdminOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  // ----------------------------------------------------
  // SUBMIT ORDER & DECREASE STOCK IN REAL-TIME
  // ----------------------------------------------------
  const handlePlaceOrderInFirestore = async (orderData: any): Promise<string> => {
    try {
      // 1. Submit order doc
      const orderRef = collection(db, 'orders');
      let docRef;
      try {
        docRef = await addDoc(orderRef, orderData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'orders');
        throw err;
      }

      // 2. Decrement stock counts in database immediately!
      const batch = writeBatch(db);
      orderData.items.forEach((it: any) => {
        const pRef = doc(db, 'products', it.productId);
        batch.update(pRef, {
          stock: increment(-it.quantity),
          updatedAt: Timestamp.now()
        });
      });

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'products_batch_stock_decrement');
        throw err;
      }
      return docRef.id;
    } catch (error) {
      console.error("Order submission failure:", error);
      throw error;
    }
  };

  // ----------------------------------------------------
  // PRODUCT CATALOUGE FILTERING
  // ----------------------------------------------------
  const filteredProducts = products.filter((p) => {
    const matchesBrand = currentBrand ? p.brand.toUpperCase() === currentBrand.toUpperCase() : true;
    const matchesCategory = selectedCategory !== 'all' ? p.category.toLowerCase() === selectedCategory.toLowerCase() : true;
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesBrand && matchesCategory && matchesSearch;
  });

  const categories = ["masculine", "feminine", "unisex", "niche"];

  return (
    <div className="min-h-screen luxe-wallpaper flex flex-col justify-between">
      
      {/* Splash Opening Shimmer Anim */}
      <AnimatePresence>
        {showSplash && (
          <SplashIntro onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {!showSplash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col flex-1"
        >
          {/* Main Glassmorphic Header */}
          <Header 
            user={user}
            userProfile={userProfile}
            cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onLogout={handleLogout}
            onToggleAdmin={handleOpenAdminPanel}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            currentBrand={currentBrand}
            setCurrentBrand={setCurrentBrand}
            categories={categories}
          />

          {/* MAIN PAGE HOME LAYOUT */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 select-none">
            
            {/* HERO INTRODUCTION BANNER */}
            <section id="hero-banner" className="relative rounded-2xl overflow-hidden glass-gold-card bg-black/60 p-8 lg:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
              {/* Backglow element */}
              <div className="absolute w-80 h-80 bg-gold-500/5 rounded-full blur-3xl pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

              <div className="relative z-15 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                
                {/* Left Content Column */}
                <div className="lg:col-span-7 space-y-6 text-left flex flex-col justify-center">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold-500/10 text-gold-400 border border-gold-400/35 text-[9px] font-mono uppercase tracking-[0.2em] rounded-full animate-pulse select-none mb-4">
                      <Sparkles className="w-3 h-3" />
                      THE ROYAL SENSORY ACCORD
                    </span>
                    <h2 className="luxury-font text-4xl sm:text-5xl lg:text-6xl text-gold-50 font-bold tracking-wide leading-[1.15]">
                      The Essence of <br />
                      <span className="text-shimmer-gold">Arabian Luxury</span>
                    </h2>
                    <p className="font-display text-[10px] sm:text-xs tracking-[0.25em] text-gold-300 mt-2 uppercase font-medium">
                      Secret Fragrance • Premium House
                    </p>
                  </div>

                  <div className="w-20 h-[1px] bg-gold-400/40" />

                  <p className="text-xs sm:text-sm text-zinc-300 max-w-xl font-serif leading-relaxed italic">
                    "Unveiling rare, 100% genuine sillage direct from iconic fragrance houses across the Middle East. Step into a world of gold, tobacco, and black amber."
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        document.getElementById('shop-brands-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-300 to-gold-400 hover:brightness-110 text-neutral-950 font-bold text-xs tracking-widest uppercase rounded shadow-[0_4px_15px_rgba(219,191,100,0.2)] transition-all cursor-pointer"
                    >
                      Explore Collections
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Visual Wireframe Column */}
                <div className="lg:col-span-5 relative flex items-center justify-center py-8">
                  {/* Absolute Rotated Frames */}
                  <div className="absolute w-56 h-72 sm:w-64 sm:h-80 border border-gold-500/25 -rotate-6 rounded-lg pointer-events-none transition-transform duration-500 hover:-rotate-12" />
                  <div className="absolute w-56 h-72 sm:w-64 sm:h-80 border border-gold-500/25 rotate-6 rounded-lg pointer-events-none transition-transform duration-500 hover:rotate-12" />
                  
                  {/* Core display card */}
                  <div className="w-56 h-72 sm:w-64 sm:h-80 bg-zinc-950/90 border border-gold-500/40 flex flex-col items-center justify-between p-5 shadow-2xl rounded-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-gold-500/5 to-transparent pointer-events-none" />
                    
                    <div className="w-full h-full border border-gold-500/10 flex flex-col items-center justify-between p-4 rounded">
                      
                      {/* Logo and floating aura */}
                      <div className="w-full flex-1 flex items-center justify-center relative">
                        <div className="w-24 h-24 rounded-full border border-gold-500/20 p-1 flex items-center justify-center bg-black/80 relative">
                          <div className="absolute inset-x-0 bottom-0 top-0 bg-gold-500/5 rounded-full blur-lg pointer-events-none" />
                          <img 
                            src="https://i.postimg.cc/6qJnp9Ld/Chat-GPT-Image-6-06-2026-12-02-47.png" 
                            alt="Secret Fragrance Seal" 
                            className="w-full h-full object-contain p-1.5 rounded-full animate-float"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      {/* Traditional caption */}
                      <div className="text-center select-none pt-3 border-t border-gold-500/15 w-full">
                        <span className="text-[10px] uppercase tracking-[0.25em] text-shimmer-gold font-extrabold block">Secret Fragrance</span>
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest block mt-0.5">La Maison de Luxe</span>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* SHOP BY BRAND SECTION */}
            <section id="shop-brands-section" className="space-y-6 pt-4 scroll-mt-24">
              <div className="text-center space-y-1">
                <h3 className="font-serif text-xl sm:text-2xl text-gold-150">Shop by Official Brand</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Select a house to filter premium formulas instantly</p>
              </div>

              {/* Dynamic Brands grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-4">
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setCurrentBrand(currentBrand.toUpperCase() === b.name.toUpperCase() ? '' : b.name)}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
                      currentBrand.toUpperCase() === b.name.toUpperCase()
                        ? "bg-[#181510] border-gold-500 shadow-[0_0_15px_rgba(219,191,100,0.15)]"
                        : "bg-[#0c0b08]/75 border-gold-300/10 hover:border-gold-300/30 hover:bg-[#11100d]"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center p-1 bg-neutral-950 select-none mb-2">
                      <img 
                        src={b.logoUrl} 
                        alt={b.name} 
                        className="w-full h-full object-contain filter brightness-95"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://i.postimg.cc/6qJnp9Ld/Chat-GPT-Image-6-06-2026-12-02-47.png";
                        }}
                      />
                    </div>
                    <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-gold-300 w-full truncate leading-tight">
                      {b.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* PRODUCT CATALOG WORKCASE */}
            <section id="collection-grid" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gold-300/10 pb-4 gap-4">
                <div>
                  <h3 className="font-serif text-lg text-gold-150 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-gold-500" />
                    Precious Perfumes Showcase
                  </h3>
                  <p className="text-xs text-zinc-500">Currently showing {filteredProducts.length} certified original boutique bottles.</p>
                </div>
              </div>

              {/* Active filters visualization */}
              {(currentBrand || selectedCategory !== 'all' || searchQuery) && (
                <div className="flex flex-wrap items-center gap-2.5 bg-black/35 border border-gold-500/10 p-3 rounded-lg">
                  <span className="text-[9px] font-mono uppercase text-zinc-400 tracking-wider">Filtros Ativos:</span>
                  {currentBrand && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] bg-gold-500/10 border border-gold-500/30 text-gold-300 rounded font-mono font-bold tracking-wider">
                      MARCA: {currentBrand.toUpperCase()}
                      <button 
                        onClick={() => setCurrentBrand('')}
                        title="Limpar filtro de marca"
                        className="text-gold-500 hover:text-gold-100 font-extrabold focus:outline-none ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] bg-gold-500/10 border border-gold-500/30 text-gold-300 rounded font-mono font-bold tracking-wider">
                      CATEGORIA: {selectedCategory.toUpperCase()}
                      <button 
                        onClick={() => setSelectedCategory('all')}
                        title="Limpar filtro de categoria"
                        className="text-gold-500 hover:text-gold-100 font-extrabold focus:outline-none ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] bg-gold-500/10 border border-gold-500/30 text-gold-300 rounded font-mono font-bold tracking-wider truncate max-w-xs">
                      BUSCA: "{searchQuery.toUpperCase()}"
                      <button 
                        onClick={() => setSearchQuery('')}
                        title="Limpar busca"
                        className="text-gold-500 hover:text-gold-100 font-extrabold focus:outline-none ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <button 
                    onClick={() => { setCurrentBrand(''); setSelectedCategory('all'); setSearchQuery(''); }}
                    className="text-[10px] text-zinc-400 hover:text-gold-400 font-bold uppercase underline tracking-wider cursor-pointer font-mono"
                  >
                    Limpar Todos
                  </button>
                </div>
              )}

              {filteredProducts.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-mono">No matching precious formulations found.</p>
                  <button 
                    onClick={() => { setCurrentBrand(""); setSelectedCategory("all"); setSearchQuery(""); }}
                    className="px-4 py-1.5 border border-gold-300/30 text-gold-300 text-xs rounded hover:bg-gold-500 hover:text-neutral-950 transition-colors cursor-pointer font-bold uppercase"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                  {filteredProducts.map((prod) => (
                    <ProductCard 
                      key={prod.id}
                      product={prod}
                      onAddToCart={(p) => handleAddToCart(p, 1)}
                      onViewDetails={(p) => setSelectedProductDetails(p)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* BRAND VALUE SECTORS */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
              <div className="p-5 rounded-lg border border-gold-300/10 bg-black/40 text-center space-y-2">
                <ShieldCheck className="w-7 h-7 text-gold-400 mx-auto animate-float" />
                <h4 className="font-serif text-sm text-gold-300 font-medium tracking-wide">100% Authentic Import</h4>
                <p className="text-xs text-zinc-400">Bottled directly at the historic manufacturing estates in Dubai and Arabian regions.</p>
              </div>
              <div className="p-5 rounded-lg border border-gold-300/10 bg-black/40 text-center space-y-2">
                <Sparkles className="w-7 h-7 text-gold-400 mx-auto" />
                <h4 className="font-serif text-sm text-gold-300 font-medium tracking-wide">Niche & Concentrated</h4>
                <p className="text-xs text-zinc-400">Featuring rich essential amber oils, pure Cambodian Oud, and complex leather sillage trails.</p>
              </div>
              <div className="p-5 rounded-lg border border-gold-300/10 bg-black/40 text-center space-y-2">
                <ShoppingBag className="w-7 h-7 text-gold-400 mx-auto" />
                <h4 className="font-serif text-sm text-gold-300 font-medium tracking-wide">WhatsApp Concierge</h4>
                <p className="text-xs text-zinc-400">Dynamic human tracking and dispatching coordination directly via WhatsApp linking.</p>
              </div>
            </section>

          </main>

          {/* LUXURIOUS FOOTER */}
          <Footer 
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenAdmin={handleOpenAdminPanel}
            socials={socials}
            user={user}
          />

          {/* ----------------------------------------------------
              OVERLAY SLIDE-OUT DRAWER AND INTERACTIVE MODALS
              ---------------------------------------------------- */}

          {/* 1. Cart Drawer sidebar */}
          <AnimatePresence>
            {isCartOpen && (
              <CartDrawer 
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onUpdateQty={handleUpdateQty}
                onRemoveItem={handleRemoveItem}
                onProceedToCheckout={handleProceedToCheckout}
                coupons={coupons}
                appliedCoupon={appliedCoupon}
                onApplyCoupon={(cp) => setAppliedCoupon(cp)}
              />
            )}
          </AnimatePresence>

          {/* 2. Interactive Product Details View Modal */}
          <AnimatePresence>
            {selectedProductDetails && (
              <ProductDetailsModal 
                product={selectedProductDetails}
                onClose={() => setSelectedProductDetails(null)}
                onAddToCart={(p, q) => handleAddToCart(p, q)}
              />
            )}
          </AnimatePresence>

          {/* 3. Customer Checkout Steps Modal */}
          <AnimatePresence>
            {isCheckoutOpen && (
              <CheckoutModal 
                onClose={() => setIsCheckoutOpen(false)}
                cart={cart}
                appliedCoupon={appliedCoupon}
                user={user}
                userProfile={userProfile}
                onClearCart={handleClearCart}
                onPlaceOrderInFirestore={handlePlaceOrderInFirestore}
              />
            )}
          </AnimatePresence>

          {/* 4. Luxury Authentication login/signup Modal */}
          <AnimatePresence>
            {isAuthOpen && (
              <AuthModal 
                onClose={() => setIsAuthOpen(false)}
                onAuthSuccess={(u, prof) => {
                  setUser(u);
                  if (prof) setUserProfile(prof);
                }}
              />
            )}
          </AnimatePresence>

          {/* 5. Comprehensive Admin dashboard suite */}
          <AnimatePresence>
            {isAdminOpen && (
              <AdminPanel 
                onClose={() => setIsAdminOpen(false)}
                products={products}
                brands={brands}
                coupons={coupons}
                socials={socials}
              />
            )}
          </AnimatePresence>

        </motion.div>
      )}

    </div>
  );
}
