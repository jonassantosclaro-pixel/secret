import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const urls = [
  "https://i.postimg.cc/fTFM9PGc/686982884-1705190440815906-733337619626056667-n.jpg",
  "https://i.postimg.cc/WbKskyBS/714998102-1548037386946893-2654742878665011145-n.jpg",
  "https://i.postimg.cc/zGg8Sj5X/715440742-1694313901900718-2216300939142043534-n.jpg",
  "https://i.postimg.cc/c4jdnzpc/715789887-1695083948485441-7425783141996980499-n.jpg",
  "https://i.postimg.cc/XYC4c8WL/716249939-780163481757474-3937490552804261794-n.jpg",
  "https://i.postimg.cc/5NGfCrhY/716350010-931641206556231-3309641370898990720-n.jpg",
  "https://i.postimg.cc/kgbqFcCT/716529976-1517571343119805-1384789481373017877-n.jpg",
  "https://i.postimg.cc/XYC4c8Wm/717495943-2087492208463615-6095574338594983698-n.jpg",
  "https://i.postimg.cc/vHjGVKJz/717495943-975127351813004-1161460290591886481-n.jpg",
  "https://i.postimg.cc/NfVQHn3D/718042738-26112970175045320-3764592483614187520-n.jpg",
  "https://i.postimg.cc/DwXndghY/718174074-28324040070517044-5730014845401731886-n.jpg",
  "https://i.postimg.cc/nc5nDWyB/718576542-889095896786284-6909579052109243575-n.jpg",
  "https://i.postimg.cc/RZH4QR9B/719135406-2039937773224467-714147355695276496-n.jpg",
  "https://i.postimg.cc/NjHB74t4/719159691-1331831154968982-411081865657655042-n.jpg",
  "https://i.postimg.cc/RV8vHYkw/719490110-1542279147451441-5121324793331117208-n.jpg",
  "https://i.postimg.cc/4NMX90Dj/719689409-3052856771587326-5073530420645344945-n.jpg",
  "https://i.postimg.cc/J4gRkFfJ/719890963-26923449604022734-1931812089540496897-n.jpg",
  "https://i.postimg.cc/T3Dfq9xZ/720654592-26997447969882845-7605294323182373968-n.jpg"
];

const ALLOWED_BRANDS = [
  "AFNAN", "AL HARAMAIN", "ARABIYAT", "ARMAF", "DESIGN PERFUMES", "FRENCH AVENUE", 
  "KHADLAJ", "LATTAFA", "MAISON ALHAMBRA", "MAISON ASRAR", "ORIENTICA", "PARIS CORNER", 
  "RASASI", "RAYHAAN", "RIFFS"
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fallbackList = [
  { name: "9pm", brand: "AFNAN", price: 50, description: "Eau de Parfum com notas doces, amadeiradas e vanila, lançamento popular com vibe noturna.", category: "unisex" },
  { name: "Chaos Extrait", brand: "ARMAF", price: 50, description: "Fragrância intensa com notas vermelhas/frutadas e madeira.", category: "masculine" },
  { name: "Pacific Pour Homme Aura", brand: "RAYHAAN", price: 50, description: "Eau de Parfum cítrico, fresco com menta, limão e notas aquáticas.", category: "masculine" },
  { name: "Club de Nuit Woman", brand: "ARMAF", price: 50, description: "Fragrância feminina doce, frutada com pêssego, lichia e floral.", category: "feminine" },
  { name: "Fakhar Lattafa", brand: "LATTAFA", price: 50, description: "Eau de Parfum floral, doce e amadeirado com rosas e baunilha.", category: "unisex" },
  { name: "Club de Nuit Precious I", brand: "ARMAF", price: 50, description: "Versão intensa e luxuosa da linha Club de Nuit.", category: "masculine" },
  { name: "Hawas Elixir", brand: "RASASI", price: 50, description: "Fragrância doce, amadeirada e gourmand com baunilha e especiarias.", category: "masculine" },
  { name: "Rayhaan Gold", brand: "RAYHAAN", price: 50, description: "Fragrância oriental com baunilha, cítricos e notas amadeiradas.", category: "unisex" },
  { name: "Club de Nuit Intense Man", brand: "ARMAF", price: 50, description: "Clássico amadeirado, cítrico e couro – um dos mais famosos da marca.", category: "masculine" },
  { name: "Liquid Brun", brand: "FRENCH AVENUE", price: 50, description: "Fragrância amadeirada, especiada e quente.", category: "masculine" },
  { name: "Hawas For Her Éclat", brand: "RASASI", price: 50, description: "Versão feminina doce e frutada da linha Hawas.", category: "feminine" },
  { name: "Odyssey Mandarin Sky Elixir (Orange)", brand: "ARMAF", price: 50, description: "Fragrância cítrica, fresca e doce da linha Odyssey.", category: "unisex" },
  { name: "Rayhaan Purple", brand: "RAYHAAN", price: 50, description: "Versão doce, frutada e gourmand (morango, baunilha, coco).", category: "unisex" },
  { name: "Yara", brand: "LATTAFA", price: 50, description: "Fragrância feminina doce, gourmand com morango, baunilha e marshmallow.", category: "feminine" },
  { name: "Muharib (Maison Asrar)", brand: "MAISON ASRAR", price: 50, description: "Fragrância amadeirada, oriental e intensa com vibe de oud/couro.", category: "masculine" },
  { name: "Asad Elixir", brand: "LATTAFA", price: 50, description: "Fragrância intensa, doce e amadeirada com açafrão e baunilha.", category: "masculine" },
  { name: "Odyssey Mandarin Sky Elixir (Blue)", brand: "ARMAF", price: 50, description: "Versão laranja/azul da linha Odyssey (cítrica e doce).", category: "unisex" },
  { name: "Nocturno Pour Homme", brand: "RAYHAAN", price: 50, description: "Fragrância noturna, amadeirada, fresca e masculina.", category: "masculine" }
];

async function processSingle(url: string, index: number) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }
    const buffer = await res.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');

    const prompt = `Identify the Arabian perfume shown in this image.
1. The brand MUST be mapped exactly to our allowed list: ${ALLOWED_BRANDS.join(", ")}. Choose the closest/matching list member. Keep it uppercase (e.g. LATTAFA, MAISON ALHAMBRA, ARMAF).
2. Get the official bottle product name (e.g. "Yara", "Khamrah", "Asad", "Club de Nuit", "Qaed Al Fursan").
3. Suggest a realistic retail price in USD (between $35.00 and $120.00). Use a clean integer.
4. Compose an elegant, professional description in English of its notes, Longevity, and Projection. Feel free to use 2 sentences.
5. Set its category value: choose strictly among "masculine", "feminine", "unisex", "niche". (Note: 'niche' stands for decants / extreme luxury).
Return a raw, clean JSON with keys: "name", "brand", "price", "description", "category"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    
    // Standardize brand to UPPERCASE
    if (parsed.brand) {
      const match = ALLOWED_BRANDS.find(b => b.toLowerCase() === parsed.brand.toLowerCase());
      if (match) parsed.brand = match;
    }
    
    console.log(`[${index + 1}/18] Successfully Identified: ${parsed.brand} - ${parsed.name}`);
    return {
      name: parsed.name || `Luxury Scent ${index + 1}`,
      brand: parsed.brand || "LATTAFA",
      price: Number(parsed.price) || 55.0,
      description: parsed.description || "An exclusive and highly sophisticated Arabian masterpiece containing refined notes, exceptional sillage, and luxurious longevity.",
      category: parsed.category || "unisex",
      imageUrl: url,
      stock: Math.floor(Math.random() * 16) + 10 // stock between 10 and 25
    };
  } catch (err: any) {
    console.error(`[${index + 1}/18] Failed: ${err.message || err}`);
    return null;
  }
}

async function identifyPerfumes() {
  console.log("Starting batch identification...", urls.length);
  const results: any[] = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    
    // Pauses 4200ms between calls to avoid API threshold rate limit (limit is strictly ~15/minute)
    if (i > 0) {
      console.log(`Waiting 4500ms before index ${i + 1}...`);
      await sleep(4500);
    }
    
    let item = await processSingle(url, i);
    if (!item) {
      console.log(`Using fallback values for index ${i + 1}`);
      const fb = fallbackList[i] || fallbackList[0];
      item = {
        ...fb,
        imageUrl: url,
        stock: Math.floor(Math.random() * 11) + 10
      };
    }
    results.push(item);
  }

  const outPath = path.join(process.cwd(), "src", "constants", "seedingData.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`Saved ${results.length} products successfully to ${outPath}!`);
}

identifyPerfumes();
