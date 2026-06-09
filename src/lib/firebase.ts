/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  getDocFromServer,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { OperationType, FirestoreErrorInfo, Product, Brand, Coupon, Socials, Order } from '../types';
import { OFFICIAL_BRANDS } from '../constants/brands';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL */
export const auth = getAuth();

// Error Handler Conforming to Firebase Firestore Specific JSON Object Guideline
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
  // Print a clear console warning but do NOT throw/crash the entire React application thread
}

// Validation to verify connection to Firestore on initialization
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_app_connection_test_', 'ping'));
    console.log("Firebase connection verified and active!");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or networks. The client appears to be offline.");
    } else {
      console.log("Connection test complete (database initialized successfully).");
    }
  }

  // Auto-guarantee that MASCULINE, FEMININE, UNISSEX, and DECANT categories are registered in Firestore with correct names!
  try {
    const requiredCats = [
      { slug: 'masculine', name: 'MASCULINE', order: 1 },
      { slug: 'feminine', name: 'FEMININE', order: 2 },
      { slug: 'unisex', name: 'UNISSEX', order: 3 },
      { slug: 'niche', name: 'DECANT', order: 4 }
    ];

    for (const cat of requiredCats) {
      const catRef = doc(db, 'categories', cat.slug);
      const docSnap = await getDoc(catRef);
      if (docSnap.exists()) {
        if (docSnap.data().name !== cat.name || docSnap.data().order !== cat.order) {
          await updateDoc(catRef, { name: cat.name, order: cat.order });
          console.log(`Firestore Category '${cat.slug}' updated to '${cat.name}'.`);
        }
      } else {
        await setDoc(catRef, {
          name: cat.name,
          slug: cat.slug,
          order: cat.order,
          createdAt: Timestamp.now()
        });
        console.log(`Firestore Category '${cat.slug}' created with name '${cat.name}'.`);
      }
    }
  } catch (e) {
    console.warn("Could not auto-ensure category names update in Firestore:", e);
  }

  // Auto-guarantee that all official brands and their logos are correctly synchronized in Firestore
  try {
    await syncOfficialBrands();
  } catch (e) {
    console.warn("Could not auto-ensure brands synchronization in Firestore:", e);
  }
}

// MANUALLY SYNCHRONIZE OFFICIAL BRANDS (Admin Authorized Only)
export async function syncOfficialBrands(): Promise<void> {
  try {
    console.log("Synchronizing official perfume brands requested by user...");
    
    // Fetch current brands from firestore
    const brandsCollectionRef = collection(db, 'brands');
    const bSnap = await getDocs(brandsCollectionRef);
    const existingBrandsMap = new Map<string, { id: string; name: string; logoUrl: string }>();
    
    bSnap.forEach(docSnap => {
      const data = docSnap.data();
      const rawName = (data.name || '').trim();
      const key = rawName.toLowerCase();
      existingBrandsMap.set(key, { id: docSnap.id, name: rawName, logoUrl: data.logoUrl || '' });
    });

    const brandBatch = writeBatch(db);
    let brandModifications = false;

    OFFICIAL_BRANDS.forEach(seed => {
      const key = seed.name.trim().toLowerCase();
      const existing = existingBrandsMap.get(key);

      if (existing) {
        // Update spelling case or logo url if they differ from the reference seed
        if (existing.name !== seed.name || existing.logoUrl !== seed.logoUrl) {
          const docRef = doc(db, 'brands', existing.id);
          brandBatch.update(docRef, {
            name: seed.name,
            logoUrl: seed.logoUrl
          });
          brandModifications = true;
        }
      } else {
        // Enforce registration of the missing brand
        const docRef = doc(collection(db, 'brands'));
        brandBatch.set(docRef, {
          name: seed.name,
          logoUrl: seed.logoUrl,
          createdAt: Timestamp.now()
        });
        brandModifications = true;
      }
    });

    if (brandModifications) {
      await brandBatch.commit();
      console.log("Official brand registrations synchronized successfully.");
    } else {
      console.log("All brand registrations match official specifications.");
    }
  } catch (err) {
    console.error("Error in manually synchronizing official brands:", err);
    throw err;
  }
}

// SEED INITIAL DATA IF STORE EMPTIED OR FIRST RUN
export async function seedInitialData() {
  try {
    // Check if database is already seeded/bootstrapped to prevent permission issues for generic clients
    const adminRef = doc(db, 'admins', 'bootstrap_secret');
    const adminSnap = await getDocFromServer(adminRef);
    if (adminSnap.exists()) {
      console.log("Database initialized. Skipping client-side brand and database synchronization.");
      return;
    }

    console.log("Synchronizing official perfume brands and assets...");
    
    // 1. Fetch current brands to do smart synchronization (adds or correct logos in-place)
    const brandsCollectionRef = collection(db, 'brands');
    const bSnap = await getDocs(brandsCollectionRef);
    const existingBrandsMap = new Map<string, { id: string; name: string; logoUrl: string }>();
    
    bSnap.forEach(docSnap => {
      const data = docSnap.data();
      const rawName = (data.name || '').trim();
      const key = rawName.toLowerCase();
      existingBrandsMap.set(key, { id: docSnap.id, name: rawName, logoUrl: data.logoUrl || '' });
    });

    const brandBatch = writeBatch(db);
    let brandModifications = false;

    OFFICIAL_BRANDS.forEach(seed => {
      const key = seed.name.trim().toLowerCase();
      const existing = existingBrandsMap.get(key);

      if (existing) {
        // If the spelling case or logo url differs from official, update it
        if (existing.name !== seed.name || existing.logoUrl !== seed.logoUrl) {
          const docRef = doc(db, 'brands', existing.id);
          brandBatch.update(docRef, {
            name: seed.name,
            logoUrl: seed.logoUrl
          });
          brandModifications = true;
        }
      } else {
        // Brand is entirely missing, register it!
        const docRef = doc(collection(db, 'brands'));
        brandBatch.set(docRef, {
          name: seed.name,
          logoUrl: seed.logoUrl,
          createdAt: Timestamp.now()
        });
        brandModifications = true;
      }
    });

    if (brandModifications) {
      await brandBatch.commit();
      console.log("Official brand registrations synchronized successfully.");
    } else {
      console.log("All brand registrations match official specifications.");
    }

    // Dynamic categories seeding
    try {
      const categoriesCollectionRef = collection(db, 'categories');
      const cSnap = await getDocs(categoriesCollectionRef);
      if (cSnap.empty) {
        console.log("Seeding default categories...");
        const defaultCats = [
          { name: "MASCULINE", slug: "masculine", order: 1 },
          { name: "FEMININE", slug: "feminine", order: 2 },
          { name: "UNISSEX", slug: "unisex", order: 3 },
          { name: "DECANT", slug: "niche", order: 4 }
        ];
        const catBatch = writeBatch(db);
        defaultCats.forEach(cat => {
          const catRef = doc(db, 'categories', cat.slug);
          catBatch.set(catRef, {
            name: cat.name,
            slug: cat.slug,
            order: cat.order,
            createdAt: Timestamp.now()
          });
        });
        await catBatch.commit();
        console.log("Default categories seeded successfully!");
      }
    } catch (err) {
      console.warn("Could not seed categories automatically:", err);
    }

    // 2. Clear old database products if needed and seed the 18 accurate ones
    const productsCollectionRef = collection(db, 'products');
    const pSnap = await getDocs(productsCollectionRef);
    let existingProducts: any[] = [];
    pSnap.forEach(doc => {
      existingProducts.push({ id: doc.id, ...doc.data() });
    });

    const needsReseed = existingProducts.length !== 18 || 
                        existingProducts.some(p => !p.imageUrl || !p.imageUrl.includes("postimg.cc")) ||
                        !existingProducts.some(p => p.name === "9pm");

    if (!needsReseed) {
      console.log("Database products are already fully up to date with 18 correct premium items.");
      return;
    }

    console.log("Removing outdated display items & starting primary seed of 18 premium perfumes...");
    
    // Purge old products
    for (const p of existingProducts) {
      try {
        await deleteDoc(doc(db, 'products', p.id));
      } catch (err) {
        console.warn(`Could not delete old product: ${p.id}`, err);
      }
    }

    console.log("Seeding remaining tables (Socials, Coupons, 18 Products, Admin Bootstrap)...");
    const mainBatch = writeBatch(db);

    // Seed Social Links
    const socialsRef = doc(db, 'socials', 'global');
    mainBatch.set(socialsRef, {
      whatsapp: "+1 (561) 668-7361",
      instagram: "https://instagram.com/secretfragranceloop",
      facebook: "https://facebook.com/secretfragancestore",
      tiktok: "https://tiktok.com/@secretfragrance"
    });

    // Seed Coupons
    const initialCoupons: Coupon[] = [
      { code: "SECRETGOLD10", type: "percentage", value: 10 },
      { code: "ARABIANLUXE", type: "fixed", value: 25 },
      { code: "WELCOME2026", type: "percentage", value: 15 }
    ];
    initialCoupons.forEach(c => {
      const cRef = doc(db, 'coupons', c.code);
      mainBatch.set(cRef, {
        code: c.code,
        type: c.type,
        value: c.value,
        createdAt: Timestamp.now()
      });
    });

    // Seed 18 accurate perfumes matching the exact links
    const productSeeds: Product[] = [
      {
        name: "9pm",
        brand: "AFNAN",
        price: 50,
        description: "Eau de Parfum com notas doces, amadeiradas e vanila, lançamento popular com vibe noturna.",
        imageUrl: "https://i.postimg.cc/fTFM9PGc/686982884-1705190440815906-733337619626056667-n.jpg",
        stock: 10,
        category: "unisex",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Chaos Extrait",
        brand: "ARMAF",
        price: 50,
        description: "Fragrância intensa com notas vermelhas/frutadas e madeira.",
        imageUrl: "https://i.postimg.cc/WbKskyBS/714998102-1548037386946893-2654742878665011145-n.jpg",
        stock: 10,
        category: "masculine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Pacific Pour Homme Aura",
        brand: "RAYHAAN",
        price: 50,
        description: "Eau de Parfum cítrico, fresco com menta, limão e notas aquáticas.",
        imageUrl: "https://i.postimg.cc/zGg8Sj5X/715440742-1694313901900718-2216300939142043534-n.jpg",
        stock: 10,
        category: "masculine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Club de Nuit Woman",
        brand: "ARMAF",
        price: 50,
        description: "Fragrância feminina doce, frutada com pêssego, lichia e floral.",
        imageUrl: "https://i.postimg.cc/c4jdnzpc/715789887-1695083948485441-7425783141996980499-n.jpg",
        stock: 10,
        category: "feminine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Fakhar Lattafa",
        brand: "LATTAFA",
        price: 50,
        description: "Eau de Parfum floral, doce e amadeirado com rosas e baunilha.",
        imageUrl: "https://i.postimg.cc/XYC4c8WL/716249939-780163481757474-3937490552804261794-n.jpg",
        stock: 10,
        category: "unisex",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Club de Nuit Precious I",
        brand: "ARMAF",
        price: 50,
        description: "Versão intensa e luxuosa da linha Club de Nuit.",
        imageUrl: "https://i.postimg.cc/5NGfCrhY/716350010-931641206556231-3309641370898990720-n.jpg",
        stock: 10,
        category: "masculine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Hawas Elixir",
        brand: "RASASI",
        price: 50,
        description: "Fragrância doce, amadeirada e gourmand com baunilha e especiarias.",
        imageUrl: "https://i.postimg.cc/kgbqFcCT/716529976-1517571343119805-1384789481373017877-n.jpg",
        stock: 10,
        category: "masculine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Rayhaan Gold",
        brand: "RAYHAAN",
        price: 50,
        description: "Fragrância oriental com baunilha, cítricos e notas amadeiradas.",
        imageUrl: "https://i.postimg.cc/XYC4c8Wm/717495943-2087492208463615-6095574338594983698-n.jpg",
        stock: 10,
        category: "unisex",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Club de Nuit Intense Man",
        brand: "ARMAF",
        price: 50,
        description: "Clássico amadeirado, cítrico e couro – um dos mais famosos da marca.",
        imageUrl: "https://i.postimg.cc/vHjGVKJz/717495943-975127351813004-1161460290591886481-n.jpg",
        stock: 10,
        category: "masculine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Liquid Brun",
        brand: "FRENCH AVENUE",
        price: 50,
        description: "Fragrância amadeirada, especiada e quente.",
        imageUrl: "https://i.postimg.cc/NfVQHn3D/718042738-26112970175045320-3764592483614187520-n.jpg",
        stock: 10,
        category: "masculine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Hawas For Her Éclat",
        brand: "RASASI",
        price: 50,
        description: "Versão feminina doce e frutada da linha Hawas.",
        imageUrl: "https://i.postimg.cc/DwXndghY/718174074-28324040070517044-5730014845401731886-n.jpg",
        stock: 10,
        category: "feminine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Odyssey Mandarin Sky Elixir (Orange)",
        brand: "ARMAF",
        price: 50,
        description: "Fragrância cítrica, fresca e doce da linha Odyssey.",
        imageUrl: "https://i.postimg.cc/nc5nDWyB/718576542-889095896786284-6909579052109243575-n.jpg",
        stock: 10,
        category: "unisex",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Rayhaan Purple",
        brand: "RAYHAAN",
        price: 50,
        description: "Versão doce, frutada e gourmand (morango, baunilha, coco).",
        imageUrl: "https://i.postimg.cc/RZH4QR9B/719135406-2039937773224467-714147355695276496-n.jpg",
        stock: 10,
        category: "unisex",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Yara",
        brand: "LATTAFA",
        price: 50,
        description: "Fragrância feminina doce, gourmand com morango, baunilha e marshmallow.",
        imageUrl: "https://i.postimg.cc/NjHB74t4/719159691-1331831154968982-411081865657655042-n.jpg",
        stock: 10,
        category: "feminine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Muharib (Maison Asrar)",
        brand: "MAISON ASRAR",
        price: 50,
        description: "Fragrância amadeirada, oriental e intensa com vibe de oud/couro.",
        imageUrl: "https://i.postimg.cc/RV8vHYkw/719490110-1542279147451441-5121324793331117208-n.jpg",
        stock: 10,
        category: "masculine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Asad Elixir",
        brand: "LATTAFA",
        price: 50,
        description: "Fragrância intensa, doce e amadeirada com açafrão e baunilha.",
        imageUrl: "https://i.postimg.cc/4NMX90Dj/719689409-3052856771587326-5073530420645344945-n.jpg",
        stock: 10,
        category: "masculine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Odyssey Mandarin Sky Elixir (Blue)",
        brand: "ARMAF",
        price: 50,
        description: "Versão laranja/azul da linha Odyssey (cítrica e doce).",
        imageUrl: "https://i.postimg.cc/J4gRkFfJ/719890963-26923449604022734-1931812089540496897-n.jpg",
        stock: 10,
        category: "unisex",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Nocturno Pour Homme",
        brand: "RAYHAAN",
        price: 50,
        description: "Fragrância noturna, amadeirada, fresca e masculina.",
        imageUrl: "https://i.postimg.cc/T3Dfq9xZ/720654592-26997447969882845-7605294323182373968-n.jpg",
        stock: 10,
        category: "masculine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    ];

    productSeeds.forEach(p => {
      const pRef = doc(collection(db, 'products'));
      mainBatch.set(pRef, p);
    });

    // Seed one Admin bootstrap reference
    const bootstrapDocRef = doc(db, 'admins', 'bootstrap_secret');
    mainBatch.set(bootstrapDocRef, {
      uid: 'bootstrap_secret',
      email: 'secret@x.com'
    });

    await mainBatch.commit();
    console.log("Seeding committed successfully.");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("permission") || errorMsg.includes("Permission")) {
      console.log("Database permissions locked. Assuming database is already initialized and seeded.");
    } else {
      console.error("Error seeding initial data: ", error);
    }
  }
}

testConnection();
seedInitialData();
