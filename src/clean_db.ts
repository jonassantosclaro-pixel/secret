import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Read firebase config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error("firebase-applet-config.json not found!");
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function listAndDeleteProducts() {
  const productsRef = collection(db, 'products');
  console.log("Fetching existing products from firestore...");
  const snapshot = await getDocs(productsRef);
  console.log(`Found ${snapshot.size} products currently in Firestore.`);
  
  if (snapshot.size > 0) {
    console.log("Deleteting all products from firestore...");
    for (const d of snapshot.docs) {
      const p = d.data();
      console.log(`Deleting product: ID ${d.id}, Brand: ${p.brand}, Name: ${p.name}`);
      await deleteDoc(doc(db, 'products', d.id));
    }
    console.log("All products successfully deleted from Firestore!");
  } else {
    console.log("No products were registered in Firestore.");
  }
}

listAndDeleteProducts().catch(err => {
  console.error("Error executing script:", err);
  process.exit(1);
});
