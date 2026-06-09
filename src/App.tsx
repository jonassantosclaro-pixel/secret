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
import { Product, Brand, CategoryObj, Coupon, Socials, CartItem, UserProfile, OperationType } from './types';
import { OFFICIAL_BRANDS } from './constants/brands';
import SEEDING_PRODUCTS from './constants/seedingData.json';

const renderBrandLogo = (b: Brand) => {
  return (
    <div className="relative w-full h-[74px] flex items-center justify-center select-none p-1">
      <img 
        src={b.logoUrl} 
        alt={b.name} 
        className="max-w-[130px] max-h-full object-contain rounded-lg transition-all duration-300 group-hover:scale-[1.08] drop-shadow-[0_4px_14px_rgba(219,191,100,0.22)] filter brightness-115 contrast-110"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const fontStyle = b.name.length > 10 ? 'text-[8.5px]' : 'text-[10.5px]';
            parent.innerHTML = `<span class="font-serif ${fontStyle} tracking-wider text-[#dbbf64] font-medium uppercase text-center">${b.name}</span>`;
          }
        }}
      />
    </div>
  );
};

export default function App() {
  // 1. Initial Launch state
  const [showSplash, setShowSplash] = useState(true);

  // 2. Core Collections State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [brands, setBrands] = useState<Brand[]>(OFFICIAL_BRANDS);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<CategoryObj[]>([
    { id: 'masculine', slug: 'masculine', name: 'MASCULINE', order: 1 },
    { id: 'feminine', slug: 'feminine', name: 'FEMININE', order: 2 },
    { id: 'unisex', slug: 'unisex', name: 'UNISSEX', order: 3 },
    { id: 'niche', slug: 'niche', name: 'DECANT', order: 4 },
  ]);
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
              isAdmin: currentUser.email === 'secret@x.com' || currentUser.email === 'jonassantosclaro@gmail.com'
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
      setLoadingProducts(false);
    }, (error) => {
      setLoadingProducts(false);
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    return () => unsubscribe();
  }, []);

  // Sync categories in real-time from Firestore
  useEffect(() => {
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats: CategoryObj[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let catName = data.name || '';
        const lowerSlug = (data.slug || doc.id || '').toLowerCase();
        if (lowerSlug === 'niche' || catName.toUpperCase() === 'NICHE') {
          catName = 'DECANT';
        } else if (lowerSlug === 'unisex' || catName.toUpperCase() === 'UNISEX') {
          catName = 'UNISSEX';
        } else if (lowerSlug === 'masculine' || catName.toUpperCase() === 'MASCULINE') {
          catName = 'MASCULINE';
        } else if (lowerSlug === 'feminine' || catName.toUpperCase() === 'FEMININE') {
          catName = 'FEMININE';
        } else {
          catName = catName.toUpperCase();
        }
        cats.push({ id: doc.id, ...data, name: catName } as CategoryObj);
      });
      if (cats.length > 0) {
        setCategories(cats);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
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
    const isUserAdmin = user && (user.email === 'secret@x.com' || user.email === 'jonassantosclaro@gmail.com' || userProfile?.isAdmin);
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
                      The Secret Behind the <br />
                      <span className="text-shimmer-gold">World of Fragrances</span>
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
                  <div className="absolute w-64 h-88 sm:w-72 sm:h-[400px] border border-gold-500/20 -rotate-6 rounded-2xl pointer-events-none transition-transform duration-500 hover:-rotate-12" />
                  <div className="absolute w-64 h-88 sm:w-72 sm:h-[400px] border border-gold-500/20 rotate-6 rounded-2xl pointer-events-none transition-transform duration-500 hover:rotate-12" />
                  
                  {/* Core display card */}
                  <div className="w-64 h-88 sm:w-72 sm:h-[400px] bg-gradient-to-b from-[#07111e]/95 to-[#010408]/95 border border-[#dbbf64]/35 flex flex-col items-center justify-between p-6 shadow-[0_15px_45px_rgba(0,0,0,0.85)] rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-gold-500/5 to-transparent pointer-events-none" />
                    
                    <div className="w-full h-full border border-[#dbbf64]/10 flex flex-col items-center justify-between p-5 rounded-xl">
                      
                      {/* Logo and floating aura */}
                      <div className="w-full flex-1 flex flex-col items-center justify-center relative pt-2">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-gold-500/15 p-1 flex items-center justify-center bg-black/40 relative shadow-[0_0_25px_rgba(219,191,100,0.15)]">
                          <div className="absolute inset-0 bg-gold-500/5 rounded-full blur-xl pointer-events-none" />
                          <img 
                            src="https://i.postimg.cc/ht7MNG1H/Chat-GPT-Image-9-06-2026-10-55-29.png" 
                            alt="Secret Fragrance Seal" 
                            className="w-[90%] h-[90%] object-contain rounded-full animate-float filter drop-shadow-[0_0_15px_rgba(219,191,100,0.4)]"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      {/* Traditional caption */}
                      <div className="text-center select-none w-full mt-4 flex flex-col items-center">
                        <h4 className="font-serif text-2xl sm:text-3xl tracking-[0.16em] text-shimmer-gold font-bold uppercase">SECRET</h4>
                        <span className="text-[10px] text-gold-300 font-mono tracking-[0.35em] uppercase block mt-1">— FRAGRANCE —</span>
                        
                        <div className="w-4/5 h-[1px] bg-gradient-to-r from-transparent via-[#dbbf64]/40 to-transparent my-4" />
                        
                        <span className="text-[8.5px] sm:text-[9.5px] text-gold-200/90 font-mono uppercase tracking-[0.25em] font-bold block">AUTHENTIC FRAGRANCES</span>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* SHOP BY BRAND SECTION */}
            <section id="shop-brands-section" className="space-y-6 pt-4 scroll-mt-24">
              <div className="text-center space-y-1.5 my-5">
                <h3 className="font-serif text-xl sm:text-2xl text-gold-150">Shop by Official Brand</h3>
                <div className="flex items-center justify-center -my-0.5">
                  <svg className="w-4 h-4 text-[#dbbf64]/80 rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <rect x="7" y="7" width="10" height="10" fill="currentColor" fillOpacity="0.25" />
                    <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.4" stroke="none" />
                  </svg>
                </div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-medium leading-relaxed max-w-sm mx-auto">
                  SELECT A HOUSE TO FILTER<br/>PREMIUM FORMULAS INSTANTLY
                </p>
              </div>

              {/* Dynamic Brands grid - exactly 3 columns on mobile, expanding gracefully on desktop */}
              <div id="brands-showcase-grid" className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                {brands.map((b) => {
                  const isActive = currentBrand.toUpperCase() === b.name.toUpperCase();
                  return (
                    <button
                      key={b.id}
                      id={`brand-filter-${b.id}`}
                      onClick={() => setCurrentBrand(isActive ? '' : b.name)}
                      className={`h-32 rounded-xl border flex flex-col items-center justify-between p-3 pb-2 text-center transition-all duration-300 cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-b from-[#0f1931] to-[#070b14] border-[#dbbf64] shadow-[0_0_15px_rgba(219,191,100,0.25)] scale-[1.03]"
                          : "bg-gradient-to-b from-[#09101f] to-[#04060c] border-[#dbbf64]/20 hover:border-gold-300/40 hover:bg-[#0b1223]"
                      }`}
                    >
                      {/* Logo or custom typographic visualization */}
                      <div className="w-full flex-1 flex items-center justify-center overflow-hidden mb-1.5">
                        {renderBrandLogo(b)}
                      </div>
                      
                      {/* Stylized subtitle label */}
                      <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-zinc-400 font-medium leading-none block w-full truncate pt-2 border-t border-[#dbbf64]/10">
                        {b.name}
                      </span>
                    </button>
                  );
                })}
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

              {loadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-[#0c0b08]/85 border border-gold-300/10 rounded-lg p-5 space-y-4 h-[420px] flex flex-col justify-between">
                      <div className="bg-zinc-900/60 h-52 w-full rounded-md" />
                      <div className="space-y-3">
                        <div className="h-4 bg-zinc-800/60 w-2/3 rounded" />
                        <div className="h-3 bg-zinc-800/40 w-1/2 rounded" />
                        <div className="h-5 bg-zinc-800/50 w-1/3 rounded" />
                      </div>
                      <div className="h-9 bg-zinc-800/30 w-full rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
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
                categories={categories}
                socials={socials}
              />
            )}
          </AnimatePresence>

        </motion.div>
      )}

    </div>
  );
}
