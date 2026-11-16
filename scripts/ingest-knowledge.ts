/**
 * Knowledge Base Ingestion Script for RAG System
 * 
 * This script creates a vector database using ChromaDB for enhanced RAG capabilities.
 * 
 * SETUP:
 * 1. Install ChromaDB: npm install chromadb
 * 2. Run: npx ts-node scripts/ingest-knowledge.ts
 * 
 * OPTIONAL: For production, consider using:
 * - Pinecone (managed, scalable)
 * - Qdrant (fast, self-hosted)
 * - Supabase pgvector (PostgreSQL)
 */

import { productToShelf } from "../src/lib/store-data";

// Type definitions
type ProductInfo = {
  name: string;
  aisle: string;
  category: string;
  description: string;
};

type Document = {
  id: string;
  text: string;
  metadata: Record<string, any>;
};

// Knowledge base data
const PRODUCTS_DATA: ProductInfo[] = [
  // Dairy & Eggs (Aisle A)
  { name: "milk", aisle: "A2", category: "dairy", description: "Fresh whole milk, 1 gallon" },
  { name: "bread", aisle: "A1", category: "bakery", description: "Whole wheat bread loaf" },
  { name: "eggs", aisle: "A3", category: "dairy", description: "Free-range large eggs, dozen" },
  { name: "cheese", aisle: "A4", category: "dairy", description: "Cheddar cheese block" },
  
  // Grains & Pasta (Aisle B)
  { name: "rice", aisle: "B2", category: "grains", description: "Basmati rice, 5kg bag" },
  { name: "pasta", aisle: "B1", category: "grains", description: "Italian spaghetti pasta" },
  { name: "chips", aisle: "B3", category: "snacks", description: "Potato chips, family size" },
  { name: "sauce", aisle: "B4", category: "condiments", description: "Marinara tomato sauce" },
  
  // Personal Care (Aisle C)
  { name: "shampoo", aisle: "C2", category: "personal_care", description: "Herbal shampoo, 500ml" },
  { name: "soap", aisle: "C1", category: "personal_care", description: "Antibacterial soap bars" },
  { name: "cereal", aisle: "C3", category: "breakfast", description: "Corn flakes cereal box" },
  { name: "tissue", aisle: "C4", category: "household", description: "Tissue paper, 4-pack" },
  
  // Add more products as needed...
];

const STORE_POLICIES = [
  {
    id: "hours",
    text: "Store operating hours: Monday through Saturday 8:00 AM to 10:00 PM, Sunday 9:00 AM to 8:00 PM. Extended hours during holidays.",
    category: "hours",
  },
  {
    id: "returns",
    text: "Return policy: Full refund or exchange within 30 days with receipt. Perishable items within 7 days. No receipt? Store credit available.",
    category: "returns",
  },
  {
    id: "delivery",
    text: "Same-day delivery available for orders over $50. Delivery window: 10 AM to 8 PM daily. Free delivery for orders over $100.",
    category: "delivery",
  },
  {
    id: "payment",
    text: "Accepted payment methods: Cash, credit/debit cards (Visa, Mastercard, Amex), mobile payments (Apple Pay, Google Pay, Samsung Pay), EBT/SNAP benefits.",
    category: "payment",
  },
];

const NAVIGATION_INFO = [
  {
    id: "layout",
    text: "Store layout: 10 aisles (A through J) arranged in two columns. Left column: A, B, C, D, E. Right column: F, G, H, I, J. Each aisle has 4 shelf levels (1-4).",
    category: "navigation",
  },
  {
    id: "entrance",
    text: "Main entrance location: Bottom-left corner of the store. Carts and baskets available at entrance. Accessible entrance available.",
    category: "navigation",
  },
  {
    id: "checkout",
    text: "Checkout counters: Located at bottom-right corner near exit. 6 regular lanes and 2 self-checkout lanes available. Express lane for 10 items or less.",
    category: "navigation",
  },
  {
    id: "wayfinding",
    text: "Smart navigation: Use the Maps & Waypoints page to get optimized shopping routes. Our A* pathfinding algorithm calculates the shortest path through multiple product locations. Click products on the map to add them to your route.",
    category: "navigation",
  },
];

const RECIPES = [
  {
    id: "pancakes",
    name: "Fluffy Pancakes",
    text: "Pancake recipe: Mix 2 cups flour (Aisle D2), 2 eggs (Aisle A3), 1.5 cups milk (Aisle A2), 2 tablespoons sugar (Aisle D1), 1 tablespoon oil (Aisle D3). Whisk until smooth. Cook on medium heat griddle until golden brown. Makes 8-10 pancakes.",
    category: "recipe",
    ingredients: ["flour", "eggs", "milk", "sugar", "oil"],
  },
  {
    id: "pasta_marinara",
    name: "Quick Pasta Marinara",
    text: "Pasta marinara recipe: Boil 1 lb pasta (Aisle B1) according to package. Heat marinara sauce (Aisle B4) with 2 tbsp olive oil (Aisle D3) and Italian spices (Aisle J3). Combine pasta with sauce, serve hot with cheese (Aisle A4).",
    category: "recipe",
    ingredients: ["pasta", "sauce", "oil", "spices", "cheese"],
  },
  {
    id: "oatmeal",
    name: "Healthy Oatmeal Bowl",
    text: "Oatmeal bowl recipe: Cook 1 cup oats (Aisle H3) with 2 cups milk (Aisle A2). Top with mixed nuts (Aisle H4), fresh fruits (Aisle J1), and drizzle of honey. Nutritious breakfast ready in 5 minutes.",
    category: "recipe",
    ingredients: ["oats", "milk", "nuts", "fruits"],
  },
];

// Build comprehensive document list
function buildDocuments(): Document[] {
  const documents: Document[] = [];

  // Add products
  PRODUCTS_DATA.forEach((product) => {
    documents.push({
      id: `product_${product.name}`,
      text: `${product.name}: ${product.description}. Located at Aisle ${product.aisle}. Category: ${product.category}.`,
      metadata: {
        type: "product",
        name: product.name,
        aisle: product.aisle,
        category: product.category,
      },
    });
  });

  // Add store policies
  STORE_POLICIES.forEach((policy) => {
    documents.push({
      id: `policy_${policy.id}`,
      text: policy.text,
      metadata: {
        type: "policy",
        category: policy.category,
      },
    });
  });

  // Add navigation info
  NAVIGATION_INFO.forEach((nav) => {
    documents.push({
      id: `nav_${nav.id}`,
      text: nav.text,
      metadata: {
        type: "navigation",
        category: nav.category,
      },
    });
  });

  // Add recipes
  RECIPES.forEach((recipe) => {
    documents.push({
      id: `recipe_${recipe.id}`,
      text: recipe.text,
      metadata: {
        type: "recipe",
        name: recipe.name,
        ingredients: recipe.ingredients,
      },
    });
  });

  return documents;
}

// Main ingestion function (for future ChromaDB integration)
async function ingestKnowledgeBase() {
  console.log("📚 Building knowledge base...");
  
  const documents = buildDocuments();
  
  console.log(`✅ Prepared ${documents.length} documents for ingestion:`);
  console.log(`   - ${PRODUCTS_DATA.length} products`);
  console.log(`   - ${STORE_POLICIES.length} store policies`);
  console.log(`   - ${NAVIGATION_INFO.length} navigation guides`);
  console.log(`   - ${RECIPES.length} recipes`);
  
  console.log("\n💡 To enable vector search with ChromaDB:");
  console.log("   1. npm install chromadb");
  console.log("   2. Uncomment ChromaDB code in this file");
  console.log("   3. Run: npx ts-node scripts/ingest-knowledge.ts");
  console.log("   4. Update /api/chat to use vector search");
  
  console.log("\n📖 Current implementation: In-memory keyword search");
  console.log("   Future: Vector similarity search with embeddings");
  
  // Uncomment below to use ChromaDB:
  /*
  const { ChromaClient } = require("chromadb");
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  
  async function embed(text: string) {
    const result = await embedModel.embedContent({ content: { parts: [{ text }] } });
    return result.embedding.values;
  }
  
  const client = new ChromaClient();
  
  try {
    await client.deleteCollection({ name: "smart_cart" });
  } catch {}
  
  const collection = await client.createCollection({ name: "smart_cart" });
  
  console.log("\n🔄 Generating embeddings...");
  const embeddings = await Promise.all(documents.map(d => embed(d.text)));
  
  await collection.add({
    ids: documents.map(d => d.id),
    documents: documents.map(d => d.text),
    metadatas: documents.map(d => d.metadata),
    embeddings,
  });
  
  console.log("✅ Vector database created!");
  */
}

// Export for use in other scripts
export { buildDocuments, PRODUCTS_DATA, STORE_POLICIES, NAVIGATION_INFO, RECIPES };

// Run if called directly
if (require.main === module) {
  ingestKnowledgeBase().catch(console.error);
}
