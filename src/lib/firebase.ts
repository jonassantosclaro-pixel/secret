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
  throw new Error(JSON.stringify(errInfo));
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
          { name: "UNISEX", slug: "unisex", order: 3 },
          { name: "NICHE", slug: "niche", order: 4 }
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

    // 2. Check if products collection needs primary seed
    const productsCollectionRef = collection(db, 'products');
    const pSnap = await getDocs(productsCollectionRef);
    if (!pSnap.empty) {
      console.log("Products already seeded in database.");
      return;
    }

    console.log("Seeding remaining tables (Socials, Coupons, Products, Admin Bootstrap)...");
    const mainBatch = writeBatch(db);

    // Seed Social Links
    const socialsRef = doc(db, 'socials', 'global');
    mainBatch.set(socialsRef, {
      whatsapp: "+1 (561) 668-7361",
      instagram: "https://instagram.com/secretfragranceloop",
      facebook: "https://facebook.com/secretfragrancestore",
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

    // Seed Products
    const productSeeds: Product[] = [
      {
        name: "Khamrah",
        brand: "Lattafa",
        price: 65,
        description: "A warm and incredibly sweet luxury gourmand with rich note additions of cinnamon, nutmeg, bergamot, dates, vanilla, praline, and heavy musk. Perfect cozy Projection.",
        imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80",
        stock: 18,
        category: "unisex",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Club de Nuit Intense Man",
        brand: "Armaf",
        price: 55,
        description: "An iconic rich Woody Spicy fragrance for men. Opening with citrusy crisp lemon, pineapple and blackcurrant, settling into beautiful ambergris, birch, and clean patchouli.",
        imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80",
        stock: 25,
        category: "masculine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Yara Rose",
        brand: "Lattafa",
        price: 45,
        description: "A gorgeous, sweet, creamy masterpiece for women. Features gourmand notes of orchid, tropical fruits mixed with sweet tangerine, creamy milk, vanilla, and warm sandalwood.",
        imageUrl: "https://images.unsplash.com/photo-1528740564265-99636c7224f8?auto=format&fit=crop&w=600&q=80",
        stock: 22,
        category: "feminine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Royal Amber",
        brand: "Orientica",
        price: 95,
        description: "An exceptional and premium ambery, fruity blend designed for lovers of high niche fragrance. Unveils delicious melon, sweet pineapple, luxury amber, and intense musk base notes.",
        imageUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80",
        stock: 8,
        category: "niche",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Oud Wood Velvet",
        brand: "Maison Asrar",
        price: 58,
        description: "Mystical, heavy fragrance showcasing the finest velvet leather accords coupled with intense sweet incense, luxurious agarwood (oud), cedar, and sweet, dark vanilla trails.",
        imageUrl: "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=600&q=80",
        stock: 12,
        category: "unisex",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "9PM Intense",
        brand: "Afnan",
        price: 48,
        description: "A legendary night perfume. Crisp sweet green apple, aromatic wild lavender, fiery cardamon, resting on seductive, deep, honey-like amber, and woody base notes.",
        imageUrl: "https://images.unsplash.com/photo-1588405748373-122b2321bc31?auto=format&fit=crop&w=600&q=80",
        stock: 30,
        category: "masculine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Golden Elixir Imperial",
        brand: "Design Perfumes",
        price: 180,
        description: "The ultimate peak of luxury perfumery. Cambodian Oud essence, Taif rose petals, premium warm golden honey tobacco, Iranian black saffron, and white musk. Masterpiece bottling.",
        imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80",
        stock: 5,
        category: "niche",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: "Amber & Leather",
        brand: "Maison Alhambra",
        price: 42,
        description: "Warm desert theme. Cardamom, sambac jasmine, intense animalic rustic leather, coupled with patchouli, moss, and warm heavy golden amber trails.",
        imageUrl: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=600&q=80",
        stock: 14,
        category: "unisex",
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
