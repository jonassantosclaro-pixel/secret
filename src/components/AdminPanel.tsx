/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Tag, Plus, Check, Edit, Trash2, Sliders, DollarSign, Package,
  Layers, ShoppingBag, Globe, ShoppingCart, UserCheck, RefreshCw, Sparkles, MessageSquare
} from 'lucide-react';
import { db, handleFirestoreError, auth, syncOfficialBrands } from '../lib/firebase';
import { 
  collection, doc, setDoc, addDoc, updateDoc, deleteDoc, 
  onSnapshot, query, orderBy, Timestamp, getDocs 
} from 'firebase/firestore';
import { Product, Brand, CategoryObj, Coupon, Socials, Order, OperationType } from '../types';
import SEEDING_PRODUCTS from '../constants/seedingData.json';

interface AdminPanelProps {
  onClose: () => void;
  products: Product[];
  brands: Brand[];
  coupons: Coupon[];
  categories: CategoryObj[];
  socials: Socials;
}

export default function AdminPanel({
  onClose,
  products,
  brands,
  coupons,
  categories,
  socials
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'brands' | 'categories' | 'pos' | 'coupons' | 'orders' | 'socials'>('products');
  
  // Real-time Orders loading inside Admin Panel
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [syncingBrands, setSyncingBrands] = useState(false);

  useEffect(() => {
    // Guard: Only fetch orders if there is an authenticated user session
    if (!auth.currentUser) {
      setLoadingOrders(false);
      return;
    }

    // Auto-synchronize brand selections silently upon admin session verification
    syncOfficialBrands().catch((err) => {
      console.warn("Silent background brands synchronization bypassed or failed:", err);
    });

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ords: Order[] = [];
      snapshot.forEach(doc => {
        ords.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(ords);
      setLoadingOrders(false);
    }, (error) => {
      setLoadingOrders(false);
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    return () => unsubscribe();
  }, []);

  const handleSyncOfficialBrands = async () => {
    if (!confirm("Deseja sincronizar e atualizar as marcas oficiais recomendadas (RAYHAAN, Maison Asrar, French Avenue, Lattafa, Khadlaj, Paris Corner, etc.) no banco de dados com seus logotipos oficiais?")) return;
    setSyncingBrands(true);
    try {
      await syncOfficialBrands();
      alert("Marcas oficiais importadas e sincronizadas com sucesso no banco de dados!");
    } catch (err) {
      alert("Erro ao sincronizar marcas: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSyncingBrands(false);
    }
  };

  const [isOperating, setIsOperating] = useState(false);

  const handleWipeAllProducts = async () => {
    if (!confirm("Tem certeza absoluta de que deseja APAGAR TODOS os produtos cadastrados do banco de dados e do site? Essa ação é irreversível!")) {
      return;
    }
    setIsOperating(true);
    try {
      const collectionRef = collection(db, 'products');
      const snap = await getDocs(collectionRef);
      let count = 0;
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'products', d.id));
        count++;
      }
      alert(`Sucesso! ${count} produtos foram totalmente excluídos do site e do banco de dados.`);
    } catch (err) {
      alert("Erro ao excluir produtos: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsOperating(false);
    }
  };

  const handleSeed18Products = async () => {
    if (!confirm("Deseja cadastrar as 18 fragrâncias premium oficiais nas marcas e categorias corretas?")) {
      return;
    }
    setIsOperating(true);
    try {
      let count = 0;
      for (const prod of SEEDING_PRODUCTS) {
        const pRef = collection(db, 'products');
        await addDoc(pRef, {
          ...prod,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        count++;
      }
      alert(`Sucesso! ${count} perfumes oficiais registrados com sucesso no banco de dados!`);
    } catch (err) {
      alert("Erro ao semear banco: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsOperating(false);
    }
  };

  // 1. PRODUCT CRUD State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    brand: '',
    price: '',
    description: '',
    imageUrl: '',
    stock: '',
    category: 'unisex'
  });

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pData = {
        name: prodForm.name,
        brand: prodForm.brand || 'RAYHAAN',
        price: Number(prodForm.price),
        description: prodForm.description,
        imageUrl: prodForm.imageUrl || 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80',
        stock: Number(prodForm.stock),
        category: prodForm.category,
        updatedAt: Timestamp.now()
      };

      if (editingProduct?.id) {
        // Edit existing product
        const pRef = doc(db, 'products', editingProduct.id);
        await updateDoc(pRef, pData);
        alert('Product modified successfully!');
      } else {
        // Add new product
        const pRef = collection(db, 'products');
        await addDoc(pRef, { ...pData, createdAt: Timestamp.now() });
        alert('Product created successfully!');
      }

      setEditingProduct(null);
      setProdForm({ name: '', brand: '', price: '', description: '', imageUrl: '', stock: '', category: 'unisex' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleEditProductClick = (p: Product) => {
    setEditingProduct(p);
    setProdForm({
      name: p.name,
      brand: p.brand,
      price: String(p.price),
      description: p.description,
      imageUrl: p.imageUrl,
      stock: String(p.stock),
      category: p.category
    });
  };

  const handleDeleteProduct = async (pId: string) => {
    if (!confirm('Are you absolutely sure you want to delete this fragrance?')) return;
    try {
      const pRef = doc(db, 'products', pId);
      await deleteDoc(pRef);
      alert('Product deleted from catalog!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${pId}`);
    }
  };

  // CATEGORIES CRUD State
  const [editingCategory, setEditingCategory] = useState<CategoryObj | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    slug: '',
    order: ''
  });

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD') // Normalize special chars / accents
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Keep alphanumeric, space and hyphen
      .trim()
      .replace(/\s+/g, '-'); // Replace space with hyphen
  };

  const handleCatNameChange = (val: string) => {
    setCatForm(prev => ({
      ...prev,
      name: val,
      slug: editingCategory ? prev.slug : generateSlug(val)
    }));
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim() || !catForm.slug.trim()) {
      alert('Por favor, preencha o nome e o slug da categoria!');
      return;
    }

    try {
      const slugVal = generateSlug(catForm.slug);
      const cData = {
        name: catForm.name.trim(),
        slug: slugVal,
        order: Number(catForm.order) || (categories.length + 1)
      };

      if (editingCategory?.id) {
        const cRef = doc(db, 'categories', editingCategory.id);
        await updateDoc(cRef, {
          ...cData,
          updatedAt: Timestamp.now()
        });
        alert('Categoria editada com sucesso no menu!');
      } else {
        const cRef = doc(db, 'categories', slugVal);
        await setDoc(cRef, {
          ...cData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        alert('Nova categoria criada e adicionada ao menu com sucesso!');
      }

      setEditingCategory(null);
      setCatForm({ name: '', slug: '', order: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'categories');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Deseja realmente excluir esta categoria? Os produtos vinculados continuarão no sistema, mas não serão listados sob esta categoria até que você redefina suas categorias olfativas.')) return;
    try {
      await deleteDoc(doc(db, 'categories', catId));
      alert('Categoria removida do menu de navegação!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${catId}`);
    }
  };

  const handleEditCategoryClick = (cat: CategoryObj) => {
    setEditingCategory(cat);
    setCatForm({
      name: cat.name,
      slug: cat.slug || '',
      order: String(cat.order || '')
    });
  };

  // 2. BRAND CRUD State
  const [brandForm, setBrandForm] = useState({ name: '', logoUrl: '' });
  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.name.trim() || !brandForm.logoUrl.trim()) return;
    try {
      const bRef = collection(db, 'brands');
      await addDoc(bRef, {
        name: brandForm.name,
        logoUrl: brandForm.logoUrl,
        createdAt: Timestamp.now()
      });
      alert('New official brand registered successfully!');
      setBrandForm({ name: '', logoUrl: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'brands');
    }
  };

  const handleDeleteBrand = async (bId: string) => {
    if (!confirm('Are you sure you want to delete this brand association?')) return;
    try {
      await deleteDoc(doc(db, 'brands', bId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `brands/${bId}`);
    }
  };

  // 3. POS REGISTER SALE State (Updating stock in real-time)
  const [posSelectedProdId, setPosSelectedProdId] = useState('');
  const [posQty, setPosQty] = useState(1);
  const handlePOSSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posSelectedProdId) {
      alert('Please select a perfume from the catalog.');
      return;
    }

    const selectedProduct = products.find(p => p.id === posSelectedProdId);
    if (!selectedProduct) return;

    if (selectedProduct.stock < posQty) {
      alert(`Critical stock failure. Only ${selectedProduct.stock} bottles left!`);
      return;
    }

    try {
      const finalStock = selectedProduct.stock - posQty;
      // 1. Update stock in products collection in real-time
      await updateDoc(doc(db, 'products', selectedProduct.id || ''), {
        stock: finalStock,
        updatedAt: Timestamp.now()
      });

      // 2. Record instant POS order in orders list
      const posOrder = {
        customerName: "Counter POS Sale",
        customerEmail: "pos@secretfragrance.com",
        customerPhone: "+1 (561) 668-7361",
        customerAddress: "Over-the-Counter Boutique Sale",
        items: [{
          productId: selectedProduct.id,
          name: `${selectedProduct.name} [POS]`,
          brand: selectedProduct.brand,
          price: selectedProduct.price,
          quantity: posQty,
          imageUrl: selectedProduct.imageUrl
        }],
        subtotal: selectedProduct.price * posQty,
        tax: Number(((selectedProduct.price * posQty) * 0.07).toFixed(2)),
        discount: 0,
        total: Number(((selectedProduct.price * posQty) * 1.07).toFixed(2)),
        couponCode: "POS",
        status: "completed",
        createdAt: new Date()
      };

      await addDoc(collection(db, 'orders'), posOrder);
      alert(`POS Sale Registered! Deducted ${posQty} bottles. New stock: ${finalStock}`);
      setPosSelectedProdId('');
      setPosQty(1);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'pos_sale');
    }
  };

  // 4. COUPONS CRUD State
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponValue, setCouponValue] = useState('');

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !couponValue) return;

    try {
      const cRef = doc(db, 'coupons', couponCode.trim().toUpperCase());
      await setDoc(cRef, {
        code: couponCode.trim().toUpperCase(),
        type: couponType,
        value: Number(couponValue),
        createdAt: Timestamp.now()
      });
      alert(`Coupon code ${couponCode.toUpperCase()} registered!`);
      setCouponCode('');
      setCouponValue('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'coupons');
    }
  };

  const handleDeleteCoupon = async (cCode: string) => {
    if (!confirm('Delete this promotional coupon code?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', cCode));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `coupons/${cCode}`);
    }
  };

  // 5. SOCIALS Links state
  const [socialForm, setSocialForm] = useState({
    whatsapp: socials.whatsapp || '',
    instagram: socials.instagram || '',
    facebook: socials.facebook || '',
    tiktok: socials.tiktok || ''
  });

  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const socRef = doc(db, 'socials', 'global');
      await setDoc(socRef, socialForm);
      alert('Social links catalog modified globally!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'socials/global');
    }
  };

  // 6. EDIT Order Status action
  const handleUpdateOrderStatus = async (oId: string, status: "pending" | "completed" | "cancelled") => {
    try {
      const oRef = doc(db, 'orders', oId);
      await updateDoc(oRef, { status });
      alert(`Order updated to status: ${status}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${oId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div 
        id="admin-dashboard-box"
        className="w-full max-w-5xl bg-[#090806] border border-gold-300/25 rounded-xl overflow-hidden shadow-[0_0_80px_rgba(219,191,100,0.2)] flex flex-col md:flex-row h-[90vh]"
      >
        {/* Left side Navbar */}
        <div className="w-full md:w-56 bg-[#0c0b08] border-b md:border-b-0 md:border-r border-gold-300/10 p-4 space-y-4 flex flex-col select-none flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="https://i.postimg.cc/ht7MNG1H/Chat-GPT-Image-9-06-2026-10-55-29.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain rounded-full border border-cyan-500/30 p-0.5 filter drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]"
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="font-display text-xs tracking-wider text-shimmer-gold font-bold">ADMIN</h4>
                <p className="font-sans text-[8px] tracking-widest text-zinc-500 font-bold uppercase">Suite Dashboard</p>
              </div>
            </div>
            {/* Mobile close only */}
            <button onClick={onClose} className="p-1 md:hidden text-zinc-400 hover:text-white cursor-pointer hover:bg-neutral-900 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none border-t border-gold-300/5 pt-3">
            <button 
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-3 py-2 text-[10px] tracking-wider uppercase rounded transition-all flex-shrink-0 cursor-pointer ${activeTab === 'products' ? 'bg-gold-500 text-gold-950 font-bold' : 'text-zinc-400 hover:bg-[#1a1814] hover:text-gold-300'}`}
            >
              <Package className="w-3.5 h-3.5" />
              Products CRUD
            </button>
            <button 
              onClick={() => setActiveTab('brands')}
              className={`flex items-center gap-2 px-3 py-2 text-[10px] tracking-wider uppercase rounded transition-all flex-shrink-0 cursor-pointer ${activeTab === 'brands' ? 'bg-gold-500 text-gold-950 font-bold' : 'text-zinc-400 hover:bg-[#1a1814] hover:text-gold-300'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              Brands Admin
            </button>
            <button 
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 px-3 py-2 text-[10px] tracking-wider uppercase rounded transition-all flex-shrink-0 cursor-pointer ${activeTab === 'categories' ? 'bg-gold-500 text-gold-950 font-bold' : 'text-zinc-400 hover:bg-[#1a1814] hover:text-gold-300'}`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Categories Menu
            </button>
            <button 
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3 py-2 text-[10px] tracking-wider uppercase rounded transition-all flex-shrink-0 cursor-pointer ${activeTab === 'pos' ? 'bg-amber-600 text-white font-bold' : 'text-zinc-400 hover:bg-[#1a1814] hover:text-gold-300'}`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              POS terminal
            </button>
            <button 
              onClick={() => setActiveTab('coupons')}
              className={`flex items-center gap-2 px-3 py-2 text-[10px] tracking-wider uppercase rounded transition-all flex-shrink-0 cursor-pointer ${activeTab === 'coupons' ? 'bg-gold-500 text-gold-950 font-bold' : 'text-zinc-400 hover:bg-[#1a1814] hover:text-gold-300'}`}
            >
              <Tag className="w-3.5 h-3.5" />
              Promo Coupons
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-3 py-2 text-[10px] tracking-wider uppercase rounded transition-all flex-shrink-0 cursor-pointer ${activeTab === 'orders' ? 'bg-gold-500 text-gold-950 font-bold' : 'text-zinc-400 hover:bg-[#1a1814] hover:text-gold-300'}`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Client Orders ({orders.length})
            </button>
            <button 
              onClick={() => setActiveTab('socials')}
              className={`flex items-center gap-2 px-3 py-2 text-[10px] tracking-wider uppercase rounded transition-all flex-shrink-0 cursor-pointer ${activeTab === 'socials' ? 'bg-gold-500 text-gold-950 font-bold' : 'text-zinc-400 hover:bg-[#1a1814] hover:text-gold-300'}`}
            >
              <Globe className="w-3.5 h-3.5" />
              Social Editor
            </button>
          </nav>

          {/* Desktop Close at bottom */}
          <button 
            onClick={onClose}
            className="w-full mt-auto hidden md:flex items-center justify-center gap-2 py-2 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded text-xs transition-colors cursor-pointer uppercase tracking-widest font-bold"
          >
            Exit Dashboard
          </button>
        </div>

        {/* Right side Tab content */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
          
          <div className="space-y-6">
            
            {/* Products tab details */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-serif text-gold-150 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold-500 animate-pulse" />
                    {editingProduct ? `Edit ${editingProduct.name}` : 'Product CRUD Catalogue'}
                  </h3>
                  <p className="text-xs text-zinc-500">Create, view, update, and delete perfumes globally.</p>
                </div>

                {/* Advanced Admin Catalog Tools */}
                <div className="p-4 rounded-lg border border-gold-300/10 bg-gradient-to-r from-red-950/20 to-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-gold-300 uppercase tracking-widest flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-gold-400 animate-spin-slow" />
                      Controles de Banco de Dados
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Apague definitivamente os perfumes atuais ou re-cadastre os 18 originais do postimg.cc de forma instantânea.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap pb-1 sm:pb-0">
                    <button
                      type="button"
                      onClick={handleWipeAllProducts}
                      disabled={isOperating}
                      className="px-3.5 py-1.5 text-[9px] font-mono uppercase font-bold tracking-wider bg-red-950/40 hover:bg-neutral-900 border border-red-500/25 rounded text-zinc-300 hover:text-red-400 transition-all cursor-pointer disabled:opacity-40"
                    >
                      {isOperating ? 'Processando...' : 'Apagar Catálogo Inteiro'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSeed18Products}
                      disabled={isOperating}
                      className="px-3.5 py-1.5 text-[9px] font-mono uppercase font-bold tracking-wider bg-emerald-950/40 hover:bg-neutral-900 border border-emerald-500/25 rounded text-zinc-300 hover:text-emerald-400 transition-all cursor-pointer disabled:opacity-40"
                    >
                      {isOperating ? 'Processando...' : 'Cadastrar 18 Perfumes Oficiais'}
                    </button>
                  </div>
                </div>

                {/* CRUD FORM */}
                <form onSubmit={handleProductSubmit} className="bg-[#0c0b08]/85 border border-gold-300/10 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-405 mb-1">Nome do Perfume *</label>
                    <input 
                      type="text" required value={prodForm.name} 
                      onChange={e => setProdForm({ ...prodForm, name: e.target.value })}
                      placeholder="Ex: Club de Nuit Intense"
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2 text-xs text-gold-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-405 mb-1">Marca da Fragrância *</label>
                    <select 
                      value={prodForm.brand} 
                      onChange={e => setProdForm({ ...prodForm, brand: e.target.value })}
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2 text-xs text-gold-50 focus:outline-none"
                    >
                      <option value="">Selecionar marca...</option>
                      {brands.map(b => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-405 mb-1">Preço ($) *</label>
                    <input 
                      type="number" step="0.01" required value={prodForm.price} 
                      onChange={e => setProdForm({ ...prodForm, price: e.target.value })}
                      placeholder="Ex: 55"
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2 text-xs text-gold-50 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-404 mb-1">Descrição / História do Perfume *</label>
                    <input 
                      type="text" required value={prodForm.description} 
                      onChange={e => setProdForm({ ...prodForm, description: e.target.value })}
                      placeholder="Ex: Aroma de oud amadeirado profundamente místico, acordes florais, etc."
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2 text-xs text-gold-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-405 mb-1">Quantidade em Estoque *</label>
                    <input 
                      type="number" required value={prodForm.stock} 
                      onChange={e => setProdForm({ ...prodForm, stock: e.target.value })}
                      placeholder="Ex: 10"
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2 text-xs text-gold-50 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-404 mb-1">Link da Imagem do Produto *</label>
                    <input 
                      type="url" value={prodForm.imageUrl} 
                      onChange={e => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                      placeholder="https://image-locator/lux.png"
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2 text-xs text-gold-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-405 mb-1">Categoria Olfativa *</label>
                    <select 
                      value={prodForm.category} 
                      onChange={e => setProdForm({ ...prodForm, category: e.target.value })}
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2 text-xs text-gold-50 focus:outline-none focus:border-gold-500"
                    >
                      <option value="">Selecionar categoria...</option>
                      {categories.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                          {cat.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-gold-300/5 mt-2">
                    {editingProduct && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingProduct(null);
                          setProdForm({ name: '', brand: '', price: '', description: '', imageUrl: '', stock: '', category: 'unisex' });
                        }}
                        className="px-4 py-1.5 border border-zinc-700 hover:bg-neutral-800 text-xs uppercase cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                    <button 
                      type="submit" 
                      className="px-5 py-1.5 bg-gradient-to-r from-gold-300 to-gold-400 text-gold-950 font-bold text-xs uppercase rounded cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                    >
                      {editingProduct ? 'Salvar Alterações' : 'Cadastrar Perfume'}
                    </button>
                  </div>
                </form>

                {/* Items table list */}
                <div className="overflow-x-auto border border-gold-300/10 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#12100d] text-gold-300 font-mono text-[9px] uppercase tracking-widest border-b border-gold-300/15 select-none">
                        <th className="p-3">Ref</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Brand</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold-300/5 select-none text-zinc-300">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-[#12100d]/40 transition-colors">
                          <td className="p-3 font-mono text-[10px] text-zinc-500">#{p.id?.substring(0, 5).toUpperCase()}</td>
                          <td className="p-3 font-medium text-white">{p.name}</td>
                          <td className="p-3 font-mono uppercase text-[10px] text-gold-400">{p.brand}</td>
                          <td className="p-3 font-bold">${p.price.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${p.stock <= 0 ? 'bg-red-500/10 text-red-400' : p.stock <= 5 ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-emerald-400'}`}>
                              {p.stock} units
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1 flex justify-end">
                            <button onClick={() => handleEditProductClick(p)} className="p-1.5 text-gold-400 hover:bg-[#1d1912] rounded" title="Edit text"><Edit className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteProduct(p.id || '')} className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded" title="Delete product"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Brands configuration tab */}
            {activeTab === 'brands' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gold-300/10 pb-4">
                  <div>
                    <h3 className="text-lg font-serif text-gold-150">Brand Association Center</h3>
                    <p className="text-xs text-zinc-500">Configure manufacturer brand houses and associate logo badges.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncOfficialBrands}
                    disabled={syncingBrands}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1c1813] border border-gold-500/30 text-gold-400 rounded hover:bg-gold-500/10 hover:text-gold-300 text-[10px] uppercase font-bold tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingBrands ? 'animate-spin' : ''}`} />
                    {syncingBrands ? 'Sincronizando...' : 'Sincronizar Marcas Oficiais'}
                  </button>
                </div>

                <form onSubmit={handleBrandSubmit} className="bg-[#0c0b08]/85 border border-gold-300/10 p-4 rounded-lg flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-405 mb-1">Brand Name *</label>
                    <input 
                      type="text" required value={brandForm.name} 
                      onChange={e => setBrandForm({ ...brandForm, name: e.target.value })}
                      placeholder="E.g., Maison Asrar"
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2 text-xs text-gold-50"
                    />
                  </div>
                  <div className="flex-[2_2_0%]">
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-405 mb-1">Logo URL *</label>
                    <input 
                      type="url" required value={brandForm.logoUrl} 
                      onChange={e => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                      placeholder="https://image-brand/logo.png"
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2 text-xs text-gold-50"
                    />
                  </div>
                  <button type="submit" className="md:self-end px-5 py-2 hover:brightness-110 bg-gold-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded h-10">
                    Add Brand
                  </button>
                </form>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {brands.map(b => (
                    <div key={b.id} className="p-3 bg-[#13110e] border border-gold-300/10 rounded-lg flex flex-col items-center text-center justify-between relative group">
                      <button 
                        onClick={() => handleDeleteBrand(b.id || '')}
                        className="absolute top-2 right-2 text-zinc-500 hover:text-rose-400 p-1 bg-neutral-950/80 rounded h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Delete brand"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      
                      <div className="w-14 h-14 bg-neutral-950 rounded-full flex items-center justify-center p-1 overflow-hidden border border-gold-300/5 mb-2">
                        <img src={b.logoUrl} alt={b.name} className="w-full h-full object-contain filter brightness-95" onError={e => (e.target as HTMLImageElement).src = "https://i.postimg.cc/ht7MNG1H/Chat-GPT-Image-9-06-2026-10-55-29.png"} referrerPolicy="no-referrer" />
                      </div>
                      <span className="font-mono text-[9.5px] uppercase tracking-wider text-gold-150 truncate max-w-full font-bold">{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* POS Inventory sale recorder tab */}
            {activeTab === 'pos' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-serif text-amber-500 flex items-center gap-1.5">
                    <ShoppingCart className="w-5 h-5 text-amber-500" />
                    POS Terminal Register (Ponto de Venda)
                  </h3>
                  <p className="text-xs text-zinc-500">Record over-the-counter boutique sales and decrement product stocks inside the database in real-time.</p>
                </div>

                <form onSubmit={handlePOSSale} className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-lg space-y-4 max-w-lg">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-1.5">Select Fragrance *</label>
                    <select 
                      required value={posSelectedProdId} 
                      onChange={e => setPosSelectedProdId(e.target.value)}
                      className="w-full bg-[#14120f] border border-amber-500/20 rounded p-2 text-xs text-gold-50 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">-- Choose Perfume --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                          {p.name} ({p.brand}) ── Price: ${p.price} ── [In Stock: {p.stock}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-1.5">Quantity to Sell *</label>
                      <input 
                        type="number" min="1" required value={posQty}
                        onChange={e => setPosQty(Number(e.target.value))}
                        className="w-full bg-[#14120f] border border-amber-500/20 rounded p-2 text-xs text-gold-50"
                      />
                    </div>
                    {/* Real-time subtotal math inside POS */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">POS Cart Total (Inc. 7% Tax)</label>
                      <div className="p-2 border border-dotted border-zinc-800 rounded bg-[#13110e] font-mono text-zinc-300 font-bold text-sm">
                        ${(posSelectedProdId ? ((products.find(p => p.id === posSelectedProdId)?.price || 0) * posQty) * 1.07 : 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-xs uppercase tracking-widest rounded transition-all cursor-pointer">
                    Register POS Counter Sale
                  </button>
                </form>
              </div>
            )}

            {/* Coupons Admin tab */}
            {activeTab === 'coupons' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-serif text-gold-150">Discount Coupon manager</h3>
                  <p className="text-xs text-zinc-500">Configure promotional checkout keys that shave percentages or flat rate USD values.</p>
                </div>

                <form onSubmit={handleCouponSubmit} className="bg-[#0c0b08]/85 border border-gold-300/10 p-4 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-405 mb-1.5">Coupon Code *</label>
                    <input 
                      type="text" required value={couponCode} 
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder="E.g., MYGOLD20"
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2 text-xs text-gold-50 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-405 mb-1.5">Reduction Type *</label>
                    <select 
                      value={couponType} 
                      onChange={e => setCouponType(e.target.value as any)}
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2 text-xs text-gold-50"
                    >
                      <option value="percentage">Percentage (%) Reduction</option>
                      <option value="fixed">Fixed US Dollar ($) reduction</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-405 mb-1.5">Discount Scalar *</label>
                    <input 
                      type="number" required value={couponValue} 
                      onChange={e => setCouponValue(e.target.value)}
                      placeholder={couponType === 'percentage' ? 'E.g., 15 (%)' : 'E.g., 20 ($)'}
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2 text-xs text-[#ebd8ad]"
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-gradient-to-r from-gold-300 to-gold-400 text-gold-950 font-bold text-xs uppercase rounded hover:brightness-110 tracking-wider">
                    Register Coupon
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {coupons.map(c => (
                    <div key={c.id} className="p-3 bg-gold-500/5 hover:bg-gold-500/10 border border-gold-300/15 rounded-lg flex justify-between items-center relative select-none">
                      <div className="space-y-1">
                        <span className="font-mono text-xs font-bold text-gold-300 tracking-wider">{c.code}</span>
                        <div className="text-[10px] text-zinc-400 font-medium">
                          {c.type === 'percentage' ? `Saves ${c.value}% discount` : `Saves Flat $${c.value.toFixed(2)}`}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteCoupon(c.id || '')} className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-neutral-900 rounded cursor-pointer" title="Delete coupon">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Client Checkout orders list */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-serif text-gold-150">Purchase Orders and Deliveries</h3>
                  <p className="text-xs text-zinc-500">Real-time scannable logs of sales generated by boutique clients.</p>
                </div>

                {loadingOrders ? (
                  <div className="p-6 text-center text-gold-300 text-xs font-mono animate-pulse">
                    Refreshing orders logs matching database...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs italic">
                    No orders have been submitted yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(o => (
                      <div key={o.id} className="p-4 bg-[#11100e] border border-gold-300/10 rounded-lg space-y-4">
                        {/* Order header row */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gold-300/5 pb-3 gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-[#ecdcb3] bg-[#1a1713] px-2 py-0.5 rounded border border-gold-500/10">Ord ID: #{o.id?.toUpperCase()}</span>
                            <span className="text-[10px] text-zinc-500 ml-2 font-mono">
                              {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : new Date(o.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {/* Order Status monitors */}
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 rounded font-bold ${o.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : o.status === 'cancelled' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-500'}`}>
                              {o.status}
                            </span>
                            <div className="flex gap-1">
                              <button onClick={() => handleUpdateOrderStatus(o.id || '', 'completed')} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-neutral-900 text-[8px] rounded uppercase font-semibold">Done</button>
                              <button onClick={() => handleUpdateOrderStatus(o.id || '', 'cancelled')} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-neutral-900 text-[8px] rounded uppercase font-semibold">Cancel</button>
                            </div>
                          </div>
                        </div>

                        {/* Customer profile info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs leading-relaxed font-sans text-zinc-400">
                          <div>👤 <span className="text-white font-medium">{o.customerName}</span></div>
                          <div>📞 <a href={`tel:${o.customerPhone}`} className="hover:underline text-gold-300">{o.customerPhone}</a></div>
                          <div>📧 <span className="text-[#eee]">{o.customerEmail}</span></div>
                        </div>

                        {/* Order items list */}
                        <div className="bg-[#14120f] border border-gold-300/5 rounded p-3 text-xs font-mono">
                          <p className="text-[8px] tracking-widest uppercase text-zinc-500 border-b border-zinc-800 pb-1.5 mb-2">Items lists</p>
                          {o.items?.map((it: any, index: number) => (
                            <div key={index} className="flex justify-between text-[11px] text-zinc-300">
                              <span>• {it.name} [{it.brand}] (x{it.quantity})</span>
                              <span>${(it.quantity * it.price).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="border-t border-zinc-800 pt-1.5 mt-2 flex justify-between font-bold text-xs">
                            <span className="text-zinc-550">Taxes (7% Separate):</span>
                            <span>${o.tax?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-xs text-gold-300 mt-1">
                            <span>TOTAL PAID:</span>
                            <span>${o.total?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Social links metadata modifier */}
            {activeTab === 'socials' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-serif text-gold-150">Boutique Social & Concierge Media</h3>
                  <p className="text-xs text-zinc-500">Edit custom WhatsApp redirect link vectors and online credentials.</p>
                </div>

                <form onSubmit={handleSocialSubmit} className="bg-[#0b0a08] border border-gold-300/15 p-5 rounded-lg space-y-4 max-w-lg">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-gold-400 mb-1.5">WhatsApp Number/Concierge *</label>
                    <input 
                      type="text" required value={socialForm.whatsapp} 
                      onChange={e => setSocialForm({ ...socialForm, whatsapp: e.target.value })}
                      placeholder="E.g., +1 (561) 668-7361"
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2.5 text-xs text-gold-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-gold-400 mb-1.5">Instagram Link</label>
                    <input 
                      type="url" value={socialForm.instagram} 
                      onChange={e => setSocialForm({ ...socialForm, instagram: e.target.value })}
                      placeholder="https://instagram.com/secretfragrance"
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2.5 text-xs text-gold-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-gold-400 mb-1.5">Facebook Link</label>
                    <input 
                      type="url" value={socialForm.facebook} 
                      onChange={e => setSocialForm({ ...socialForm, facebook: e.target.value })}
                      placeholder="https://facebook.com/secretfragrance"
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2.5 text-xs text-gold-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-gold-400 mb-1.5">TikTok Link</label>
                    <input 
                      type="url" value={socialForm.tiktok} 
                      onChange={e => setSocialForm({ ...socialForm, tiktok: e.target.value })}
                      placeholder="https://tiktok.com/@secretfragrance"
                      className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2.5 text-xs text-gold-50"
                    />
                  </div>

                  <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-gold-300 to-gold-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded">
                    Save Social Links
                  </button>
                </form>
              </div>
            )}

            {/* Categories Menu config tab */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-serif text-gold-150 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-gold-500" />
                    Category Management & Navigation Menu
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Add, remove, or edit your storefront navigation menu. Change display names, automatic identifier slugs, or display order.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Create/Edit Category Form */}
                  <form onSubmit={handleCategorySubmit} className="lg:col-span-5 bg-[#0c0b08]/85 border border-gold-300/10 p-5 rounded-lg space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-gold-300 border-b border-gold-300/10 pb-2">
                      {editingCategory ? 'Editar Categoria' : 'Nova Categoria de Produto'}
                    </h4>
                    
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Nome de Exibição *</label>
                      <input 
                        type="text" 
                        required 
                        value={catForm.name} 
                        onChange={e => handleCatNameChange(e.target.value)}
                        placeholder="Ex: Masculino, Promoções, Edições Limitadas"
                        className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2.5 text-xs text-gold-50 focus:outline-none focus:border-gold-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Identificador Único (Slug) *</label>
                      <input 
                        type="text" 
                        required 
                        value={catForm.slug} 
                        onChange={e => setCatForm({ ...catForm, slug: generateSlug(e.target.value) })}
                        placeholder="Ex: masculino, promocoes, edicoes-limitadas"
                        className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2.5 text-xs text-gold-50 focus:outline-none focus:border-gold-500"
                      />
                      <span className="text-[10px] text-zinc-500 mt-1 block">
                        O slug determina a correspondência exata para filtrar os produtos. Use letras, números e hífens.
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Ordem de Exibição (Número)</label>
                      <input 
                        type="number" 
                        value={catForm.order} 
                        onChange={e => setCatForm({ ...catForm, order: e.target.value })}
                        placeholder="Ex: 5"
                        className="w-full bg-[#14120f] border border-gold-300/15 rounded p-2.5 text-xs text-gold-50 focus:outline-none focus:border-gold-500"
                      />
                      <span className="text-[10px] text-zinc-500 mt-1 block">
                        Define em qual posição do menu esta categoria aparecerá (menor número aparece primeiro).
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                       {editingCategory && (
                         <button 
                           type="button" 
                           onClick={() => {
                             setEditingCategory(null);
                             setCatForm({ name: '', slug: '', order: '' });
                           }}
                           className="flex-1 py-2 border border-zinc-700 hover:bg-neutral-800 text-xs text-zinc-300 uppercase rounded cursor-pointer transition-colors"
                         >
                           Cancelar
                         </button>
                       )}
                       <button 
                         type="submit" 
                         className="flex-1 py-2 bg-gradient-to-r from-gold-300 to-gold-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                       >
                         {editingCategory ? 'Salvar Categoria' : 'Adicionar no Menu'}
                       </button>
                    </div>
                  </form>

                  {/* List of Existing Categories */}
                  <div className="lg:col-span-7 bg-[#0c0b08]/50 border border-gold-300/10 p-5 rounded-lg space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-gold-300 border-b border-gold-300/10 pb-2">
                      Categorias Ativas ({categories.length})
                    </h4>

                    {categories.length === 0 ? (
                      <p className="text-xs text-zinc-500">Nenhuma categoria registrada.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-gold-300/10 text-gold-300/60 font-mono text-[9px] uppercase tracking-wider pb-2">
                              <th className="py-2 pr-4">Ordem</th>
                              <th className="py-2 pr-4">Nome de Exibição</th>
                              <th className="py-2 pr-4">Slug Identificador</th>
                              <th className="py-2 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gold-300/5 text-zinc-300">
                            {categories.map((cat) => (
                              <tr key={cat.id || cat.slug} className="hover:bg-[#12100d]/40 transition-colors">
                                <td className="py-3 pr-4 font-mono font-bold text-gold-400">{cat.order || '-'}</td>
                                <td className="py-3 pr-4 font-medium text-white">{cat.name}</td>
                                <td className="py-3 pr-4 font-mono text-[11px] text-zinc-500">{cat.slug}</td>
                                <td className="py-3 text-right space-x-1">
                                  <button 
                                    onClick={() => handleEditCategoryClick(cat)} 
                                    className="p-1.5 text-gold-400 hover:bg-[#1d1912] rounded transition-colors" 
                                    title="Editar categoria"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteCategory(cat.id || cat.slug || '')} 
                                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded transition-colors" 
                                    title="Deletar categoria"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
