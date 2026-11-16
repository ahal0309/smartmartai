import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";
import Promotion from "@/models/Promotion";

// In-memory knowledge base (will be replaced by vector DB in production)
const KNOWLEDGE_BASE = {
  products: {
    // Dairy & Eggs (Aisle A)
    milk: { aisle: "A2", category: "dairy", description: "Fresh whole milk" },
    bread: { aisle: "A1", category: "bakery", description: "Whole wheat bread" },
    eggs: { aisle: "A3", category: "dairy", description: "Free-range eggs" },
    cheese: { aisle: "A4", category: "dairy", description: "Cheddar cheese" },
    
    // Grains & Pasta (Aisle B)
    rice: { aisle: "B2", category: "grains", description: "Basmati rice, 5kg" },
    pasta: { aisle: "B1", category: "grains", description: "Italian pasta" },
    chips: { aisle: "B3", category: "snacks", description: "Potato chips" },
    sauce: { aisle: "B4", category: "condiments", description: "Tomato sauce" },
    
    // Personal Care (Aisle C)
    shampoo: { aisle: "C2", category: "personal_care", description: "Herbal shampoo" },
    soap: { aisle: "C1", category: "personal_care", description: "Antibacterial soap" },
    cereal: { aisle: "C3", category: "breakfast", description: "Corn flakes" },
    tissue: { aisle: "C4", category: "household", description: "Tissue paper" },
    
    // Baking & Cooking (Aisle D)
    sugar: { aisle: "D1", category: "baking", description: "White sugar" },
    flour: { aisle: "D2", category: "baking", description: "All-purpose flour" },
    oil: { aisle: "D3", category: "cooking", description: "Vegetable oil" },
    salt: { aisle: "D4", category: "spices", description: "Sea salt" },
    
    // Hot Beverages (Aisle E)
    tea: { aisle: "E1", category: "beverages", description: "Black tea" },
    coffee: { aisle: "E2", category: "beverages", description: "Ground coffee" },
    biscuits: { aisle: "E3", category: "snacks", description: "Butter biscuits" },
    cocoa: { aisle: "E4", category: "baking", description: "Cocoa powder" },
    
    // Cold Beverages (Aisle F)
    juice: { aisle: "F1", category: "beverages", description: "Orange juice" },
    soda: { aisle: "F2", category: "beverages", description: "Cola drink" },
    water: { aisle: "F3", category: "beverages", description: "Bottled water" },
    sports_drink: { aisle: "F4", category: "beverages", description: "Sports drink" },
    
    // Snacks & Sweets (Aisle G)
    cookies: { aisle: "G1", category: "snacks", description: "Chocolate cookies" },
    crackers: { aisle: "G2", category: "snacks", description: "Wheat crackers" },
    candy: { aisle: "G3", category: "sweets", description: "Assorted candy" },
    chocolate: { aisle: "G4", category: "sweets", description: "Dark chocolate" },
    
    // Legumes & Grains (Aisle H)
    beans: { aisle: "H1", category: "legumes", description: "Kidney beans" },
    lentils: { aisle: "H2", category: "legumes", description: "Red lentils" },
    oats: { aisle: "H3", category: "grains", description: "Rolled oats" },
    nuts: { aisle: "H4", category: "snacks", description: "Mixed nuts" },
    
    // Cleaning (Aisle I)
    detergent: { aisle: "I1", category: "cleaning", description: "Laundry detergent" },
    bleach: { aisle: "I2", category: "cleaning", description: "Bleach cleaner" },
    cleaner: { aisle: "I3", category: "cleaning", description: "All-purpose cleaner" },
    sponges: { aisle: "I4", category: "cleaning", description: "Kitchen sponges" },
    
    // Fresh Produce (Aisle J)
    fruits: { aisle: "J1", category: "produce", description: "Fresh fruits" },
    vegetables: { aisle: "J2", category: "produce", description: "Fresh vegetables" },
    spices: { aisle: "J3", category: "spices", description: "Spice collection" },
    snacks: { aisle: "J4", category: "snacks", description: "Healthy snacks" },
  },
  
  storeInfo: {
    hours: "Store hours: Monday-Saturday 8:00 AM - 10:00 PM, Sunday 9:00 AM - 8:00 PM",
    returns: "Return policy: 30-day returns with receipt. Perishables within 7 days. Full refund or exchange available.",
    delivery: "We offer same-day delivery for orders over $50. Delivery hours: 10 AM - 8 PM daily.",
    payment: "We accept cash, credit/debit cards, mobile payments (Apple Pay, Google Pay), and EBT/SNAP.",
    contact: "Customer service: (555) 123-4567 | Email: support@smartmart.com",
  },
  
  navigation: {
    layout: "Our store has 10 aisles (A through J) arranged in 2 columns. Entrance is at the bottom-left, checkout is at the bottom-right.",
    entrance: "Main entrance is located at the bottom-left corner of the store.",
    checkout: "Checkout counters are located at the bottom-right corner, near the exit.",
    aisleMap: {
      "A-E": "Left side of the store (Aisles A, B, C, D, E from left to right)",
      "F-J": "Right side of the store (Aisles F, G, H, I, J from left to right)",
    },
    wayfinding: "Use the Maps & Waypoints page to get optimized routes to your shopping list. The system uses A* pathfinding to find the shortest path.",
  },
  
  recipes: [
    {
      name: "Pancakes",
      ingredients: ["flour (D2)", "eggs (A3)", "milk (A2)", "sugar (D1)", "oil (D3)"],
      instructions: "Mix 2 cups flour, 2 eggs, 1.5 cups milk, 2 tbsp sugar, 1 tbsp oil. Cook on griddle until golden.",
    },
    {
      name: "Pasta Marinara",
      ingredients: ["pasta (B1)", "sauce (B4)", "oil (D3)", "spices (J3)"],
      instructions: "Boil pasta, heat sauce with oil and spices, combine and serve.",
    },
    {
      name: "Morning Oatmeal",
      ingredients: ["oats (H3)", "milk (A2)", "nuts (H4)", "fruits (J1)"],
      instructions: "Cook oats with milk, top with nuts and fresh fruits.",
    },
  ],
};

async function findRelevantInfo(query: string): Promise<{ context: string; sources: Array<{ title: string; url?: string }> }> {
  const q = query.toLowerCase();
  const sources: Array<{ title: string; url?: string }> = [];
  const contextParts: string[] = [];

  // Search database products for real pricing
  try {
    await connectToDatabase();
    
    // Extract key words from query for better matching
    const searchWords = q.split(/\s+/).filter(w => w.length > 2);
    const searchPattern = searchWords.length > 0 
      ? searchWords.map(w => `(?=.*${w})`).join('') 
      : query;
    
    // First try: exact or partial name match
    let dbProducts = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    }).limit(20).select('name price category description stockQuantity');

    // If no results, try broader search with individual words
    if (dbProducts.length === 0 && searchWords.length > 0) {
      const wordQueries = searchWords.map(word => ({
        $or: [
          { name: { $regex: word, $options: 'i' } },
          { category: { $regex: word, $options: 'i' } },
          { description: { $regex: word, $options: 'i' } }
        ]
      }));
      
      dbProducts = await Product.find({
        $or: wordQueries
      }).limit(20).select('name price category description stockQuantity');
    }

    console.log(`🔍 [RAG Chat] Query: "${query}" - Found ${dbProducts.length} products in database`);

    if (dbProducts.length > 0) {
      const productList = dbProducts.map(p => {
        const stockInfo = p.stockQuantity > 0 ? `${p.stockQuantity} in stock` : '⚠️ Out of stock';
        const desc = p.description || p.category || '';
        return `• ${p.name}: **₹${p.price.toFixed(2)}** - ${desc} (${stockInfo})`;
      });
      contextParts.push("**📦 Products with Current Prices:**\n" + productList.slice(0, 15).join("\n"));
      dbProducts.slice(0, 5).forEach(p => sources.push({ 
        title: `${p.name} - ₹${p.price.toFixed(2)}${p.stockQuantity > 0 ? '' : ' (Out of stock)'}` 
      }));
    } else {
      console.log(`⚠️ [RAG Chat] No products found in database for query: "${query}"`);
    }
  } catch (error) {
    console.error("❌ [RAG Chat] Error fetching products from database:", error);
  }

  // Search active promotions
  try {
    await connectToDatabase();
    const now = new Date();
    
    // Check if query mentions promotions/deals/discounts/offers
    const isPromotionQuery = /promo|deal|discount|offer|sale|special|coupon|code/i.test(q);
    
    // Get active promotions
    const activePromotions = await Promotion.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).select('name type discountValue code description startDate endDate minimumPurchase applicableProducts applicableCategories');

    if (activePromotions.length > 0 && (isPromotionQuery || q.includes('price') || q.includes('save') || q.includes('cheap'))) {
      const promoList = activePromotions.map(promo => {
        const discount = promo.type === 'percentage' 
          ? `${promo.discountValue}% OFF` 
          : `₹${promo.discountValue} OFF`;
        
        let appliesTo = 'All products';
        if (promo.applicableProducts && promo.applicableProducts.length > 0) {
          appliesTo = `${promo.applicableProducts.length} specific products`;
        } else if (promo.applicableCategories && promo.applicableCategories.length > 0) {
          appliesTo = `Categories: ${promo.applicableCategories.join(', ')}`;
        }
        
        const endDate = new Date(promo.endDate).toLocaleDateString();
        const codeInfo = promo.code ? ` | Code: **${promo.code}**` : '';
        const minPurchase = promo.minimumPurchase ? ` | Min purchase: ₹${promo.minimumPurchase}` : '';
        
        return `🎉 **${promo.name}**: ${discount}${codeInfo}\n   ${promo.description || ''}\n   Applies to: ${appliesTo}${minPurchase}\n   Valid until: ${endDate}`;
      });
      
      contextParts.push("**🎉 Active Promotions & Deals:**\n" + promoList.join("\n\n"));
      activePromotions.forEach(p => sources.push({ 
        title: `${p.name} - ${p.type === 'percentage' ? p.discountValue + '%' : '₹' + p.discountValue} OFF` 
      }));
      
      console.log(`🎉 [RAG Chat] Found ${activePromotions.length} active promotions`);
    } else if (isPromotionQuery && activePromotions.length === 0) {
      contextParts.push("**🎉 Promotions:**\nNo active promotions at the moment. Check back soon for great deals!");
      console.log(`⚠️ [RAG Chat] No active promotions found`);
    }
  } catch (error) {
    console.error("❌ [RAG Chat] Error fetching promotions:", error);
  }

  // Search inventory status - for owner queries
  const isInventoryQuery = /inventory|stock|low stock|out of stock|restock|shortage|supply|warehouse/i.test(q);
  const isOwnerQuery = /owner|business|management|analytics|sales|revenue|profit/i.test(q);
  
  if (isInventoryQuery || isOwnerQuery) {
    try {
      await connectToDatabase();
      
      // Get inventory statistics
      const totalProducts = await Product.countDocuments();
      const outOfStock = await Product.countDocuments({ stockQuantity: 0 });
      const lowStock = await Product.countDocuments({ stockQuantity: { $gt: 0, $lte: 10 } });
      const inStock = totalProducts - outOfStock - lowStock;
      
      // Get specific low stock and out of stock items
      const lowStockItems = await Product.find({ 
        stockQuantity: { $gt: 0, $lte: 10 } 
      }).select('name stockQuantity price category').limit(10);
      
      const outOfStockItems = await Product.find({ 
        stockQuantity: 0 
      }).select('name price category').limit(10);
      
      // Get high value inventory
      const highValueItems = await Product.find({ 
        stockQuantity: { $gt: 0 }
      }).sort({ price: -1 }).select('name price stockQuantity category').limit(5);
      
      // Build inventory report
      const inventoryReport = [
        `📊 **Inventory Overview:**`,
        `• Total Products: ${totalProducts}`,
        `• ✅ In Stock: ${inStock} items`,
        `• ⚠️ Low Stock: ${lowStock} items (≤10 units)`,
        `• ❌ Out of Stock: ${outOfStock} items`,
        ``
      ];
      
      if (lowStockItems.length > 0) {
        inventoryReport.push(`⚠️ **Low Stock Items (Need Restocking):**`);
        lowStockItems.forEach(item => {
          inventoryReport.push(`• ${item.name}: Only ${item.stockQuantity} left (₹${item.price.toFixed(2)}) - ${item.category}`);
        });
        inventoryReport.push(``);
      }
      
      if (outOfStockItems.length > 0) {
        inventoryReport.push(`❌ **Out of Stock Items (Urgent!):**`);
        outOfStockItems.forEach(item => {
          inventoryReport.push(`• ${item.name} (₹${item.price.toFixed(2)}) - ${item.category}`);
        });
        inventoryReport.push(``);
      }
      
      if (highValueItems.length > 0 && (q.includes('high') || q.includes('expensive') || q.includes('value'))) {
        inventoryReport.push(`💎 **High Value Products:**`);
        highValueItems.forEach(item => {
          inventoryReport.push(`• ${item.name}: ₹${item.price.toFixed(2)} (${item.stockQuantity} in stock) - ${item.category}`);
        });
      }
      
      contextParts.push(inventoryReport.join('\n'));
      sources.push({ title: `Inventory Status: ${inStock} in stock, ${lowStock} low, ${outOfStock} out` });
      
      console.log(`📦 [RAG Chat] Inventory: ${inStock} in stock, ${lowStock} low, ${outOfStock} out of stock`);
    } catch (error) {
      console.error("❌ [RAG Chat] Error fetching inventory:", error);
    }
  }

  // Search static knowledge base products (for aisle locations)
  const matchedProducts: string[] = [];
  Object.entries(KNOWLEDGE_BASE.products).forEach(([name, info]) => {
    if (
      q.includes(name) ||
      q.includes(info.category) ||
      q.includes(info.aisle.toLowerCase()) ||
      info.description.toLowerCase().includes(q)
    ) {
      matchedProducts.push(
        `${name}: ${info.description} - Located at Aisle ${info.aisle} (${info.category})`
      );
      sources.push({ title: `${name} at Aisle ${info.aisle}` });
    }
  });

  if (matchedProducts.length > 0) {
    contextParts.push("**Product Locations:**\n" + matchedProducts.slice(0, 10).join("\n"));
  }

  // Search store info
  if (q.includes("hour") || q.includes("open") || q.includes("close")) {
    contextParts.push("**Store Hours:**\n" + KNOWLEDGE_BASE.storeInfo.hours);
    sources.push({ title: "Store Hours" });
  }
  if (q.includes("return") || q.includes("refund")) {
    contextParts.push("**Return Policy:**\n" + KNOWLEDGE_BASE.storeInfo.returns);
    sources.push({ title: "Return Policy" });
  }
  if (q.includes("delivery") || q.includes("ship")) {
    contextParts.push("**Delivery:**\n" + KNOWLEDGE_BASE.storeInfo.delivery);
    sources.push({ title: "Delivery Info" });
  }
  if (q.includes("payment") || q.includes("pay")) {
    contextParts.push("**Payment:**\n" + KNOWLEDGE_BASE.storeInfo.payment);
    sources.push({ title: "Payment Methods" });
  }
  if (q.includes("contact") || q.includes("phone") || q.includes("email")) {
    contextParts.push("**Contact:**\n" + KNOWLEDGE_BASE.storeInfo.contact);
    sources.push({ title: "Contact Info" });
  }

  // Search navigation/map info
  if (
    q.includes("map") ||
    q.includes("navigate") ||
    q.includes("where") ||
    q.includes("find") ||
    q.includes("aisle") ||
    q.includes("location") ||
    q.includes("waypoint")
  ) {
    contextParts.push("**Store Layout:**\n" + KNOWLEDGE_BASE.navigation.layout);
    contextParts.push("**Entrance:**\n" + KNOWLEDGE_BASE.navigation.entrance);
    contextParts.push("**Checkout:**\n" + KNOWLEDGE_BASE.navigation.checkout);
    contextParts.push(
      "**Wayfinding:**\n" + KNOWLEDGE_BASE.navigation.wayfinding
    );
    sources.push({ title: "Store Map & Navigation" });
  }

  // Search recipes
  if (q.includes("recipe") || q.includes("cook") || q.includes("make")) {
    KNOWLEDGE_BASE.recipes.forEach((recipe) => {
      if (
        q.includes(recipe.name.toLowerCase()) ||
        recipe.ingredients.some((ing) => q.includes(ing.split(" ")[0]))
      ) {
        contextParts.push(
          `**Recipe: ${recipe.name}**\nIngredients: ${recipe.ingredients.join(", ")}\nInstructions: ${recipe.instructions}`
        );
        sources.push({ title: `Recipe: ${recipe.name}` });
      }
    });
  }

  // If no specific matches, provide general store info and try to fetch popular products
  if (contextParts.length === 0) {
    contextParts.push("**General Store Information:**");
    contextParts.push(KNOWLEDGE_BASE.storeInfo.hours);
    contextParts.push(KNOWLEDGE_BASE.navigation.layout);
    
    // Try to fetch some popular products to show
    try {
      await connectToDatabase();
      const popularProducts = await Product.find({ stockQuantity: { $gt: 0 } })
        .sort({ stockQuantity: -1 })
        .limit(10)
        .select('name price category stockQuantity');
      
      if (popularProducts.length > 0) {
        const popularList = popularProducts.map(p => 
          `• ${p.name}: ₹${p.price.toFixed(2)} (${p.category}) - ${p.stockQuantity} in stock`
        );
        contextParts.push("**🔥 Popular Products Available:**\n" + popularList.join("\n"));
      }
    } catch (error) {
      console.error("Error fetching popular products:", error);
    }
    
    contextParts.push(
      "**Categories Available:** Dairy, Bakery, Personal Care, Baking, Beverages, Snacks, Cleaning, Fresh Produce, and more."
    );
    sources.push({ title: "General Store Info" });
  }

  return {
    context: contextParts.join("\n\n"),
    sources: sources.slice(0, 8), // Increased to show more sources
  };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY. Set it in .env.local" },
        { status: 500 }
      );
    }

    const { query, image, history = [] } = await req.json();

    if (!query?.trim() && !image) {
      return NextResponse.json({ error: "Empty query" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const envModel = process.env.GEMINI_MODEL;
    const preferredModels = [
      envModel || "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash-001",
      "gemini-1.5-pro-001",
      "gemini-1.0-pro",
      "gemini-pro",
    ].filter(Boolean) as string[];

    // Retrieve relevant context from knowledge base (async now)
    const { context, sources } = await findRelevantInfo(query || "store information");

    // Build conversation history
    const historyText = history
      .slice(-5)
      .map((h: any) => `${h.role === "user" ? "Customer" : "Assistant"}: ${h.content}`)
      .join("\n");

    // Build system prompt with RAG context
    const systemPrompt = `You are a helpful, friendly assistant for Smart Mart grocery store. Use the following store information to answer customer questions accurately.

**STORE KNOWLEDGE BASE:**
${context || "⚠️ No relevant information found in knowledge base."}

${historyText ? `**CONVERSATION HISTORY:**\n${historyText}\n` : ""}

**CURRENT QUESTION:** ${query}

**INSTRUCTIONS:**
- **CRITICAL: USE THE DATABASE INFORMATION ABOVE!** The "Products with Current Prices" section contains real, live product data with actual prices and stock levels
- **PROMOTIONS**: If "Active Promotions & Deals" section exists above, ALWAYS mention relevant promotions when discussing products or prices
- **INVENTORY MANAGEMENT**: If "Inventory Overview" section exists, provide detailed stock analysis for business/owner queries
- Provide clear, concise, and helpful answers based ONLY on the knowledge base above
- **ALWAYS include prices** from the database when discussing products (e.g., "Milk is ₹45.00 and we have 25 in stock")
- **Mention current stock status** from the database (e.g., "15 in stock" or "⚠️ Out of stock")
- **Mention applicable promotions** - If a product category has a promotion, mention it! (e.g., "Plus there's a 20% OFF promotion on dairy products - use code DAIRY20")
- **For inventory queries**: Provide actionable insights (e.g., "You have 15 items low on stock that need immediate restocking")
- **For business queries**: Use the inventory data to provide strategic advice (e.g., "Focus on restocking high-value items first")
- Combine database prices with aisle locations from the Product Locations section when available
- Be friendly and conversational (use customer tone for shopping queries, professional tone for business/owner queries)
- If asked about navigation, explain our Maps & Waypoints feature
- **Format prices clearly**: Always use ₹ symbol and 2 decimal places (e.g., ₹50.00)
- **When asked about deals/promotions**: List ALL active promotions from the "Active Promotions & Deals" section
- **When asked about inventory/stock**: Provide summary stats AND specific items that need attention
- **When products ARE in the database**: Give complete info with price, stock, location, AND any applicable promotions
- **When products are NOT in the database**: 
  * Say "I don't see [product] in our current inventory"
  * Suggest similar items from the database with prices
  * Offer to help find alternatives: "Would you like me to suggest similar products?"
- When comparing products, always compare prices, stock availability, AND applicable promotions from the database
- **DO NOT** say "I don't have pricing information" if the product is listed in the "Products with Current Prices" section above!
- **DO NOT** ignore promotions or inventory data if they are listed in the knowledge base above!
- **Owner-focused queries**: Prioritize actionable business insights (restock urgency, revenue opportunities, inventory optimization)

${context ? "Provide your answer using the knowledge base above." : "⚠️ No matching information found. Be honest about this limitation."}

Answer:`;

    const parts: any[] = [{ text: systemPrompt }];

    // Handle image if provided
    if (image) {
      const isDataUrl = /^data:image\/[a-z0-9+.-]+;base64,/i.test(image);
      if (isDataUrl) {
        const [mimeType, base64Data] = image.split(";base64,");
        const cleanMimeType = mimeType.replace("data:", "");
        parts.push({
          inlineData: {
            mimeType: cleanMimeType,
            data: base64Data,
          },
        });
        parts[0].text += "\n\n[Customer has attached an image. Analyze it and provide relevant information about the product or help identify it if it's a grocery item.]";
      }
    }

    // Helper: try a sequence of models
    const tryModels = async (models: string[]) => {
      let lastErr: any = null;
      for (const m of models) {
        try {
          const mdl = genAI.getGenerativeModel({ model: m });
          const result = await mdl.generateContent({
            contents: [{ role: "user", parts }],
          });
          const text = result?.response?.text()?.trim() || "";
          return { ok: true, model: m, text } as const;
        } catch (e: any) {
          const msg = String(e?.message || e);
          if (/404|not found|not\s+supported|unsupported/i.test(msg)) {
            lastErr = msg;
            continue;
          }
          return { ok: false, error: msg } as const;
        }
      }
      return { ok: false, error: lastErr || "All candidate models failed" } as const;
    };

    // First, try preferred models list
    const firstTry = await tryModels(preferredModels);
    if (firstTry.ok) {
      // Add disclaimer if no sources found
      let finalAnswer = firstTry.text;
      if (sources.length === 0) {
        finalAnswer += "\n\n💡 **Note:** This information wasn't found in our product catalog or store policies. For the most accurate information, please contact our staff at (555) 123-4567.";
      }
      
      return NextResponse.json({
        answer: finalAnswer,
        sources: sources.length > 0 ? sources : undefined,
        modelUsed: firstTry.model,
      });
    }

    // If that failed, list available models and retry
    try {
      const listResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      );
      const listJson: any = await listResp.json().catch(() => ({}));
      const names: string[] = Array.isArray(listJson?.models)
        ? listJson.models.map((m: any) => m?.name).filter(Boolean)
        : [];
      const filtered = names.filter(
        (n) => typeof n === "string" && /gemini/i.test(n) && /1\.\d|pro|flash/i.test(n)
      );
      const score = (n: string) =>
        (/(1\.5)/.test(n) ? 100 : 0) +
        (/(flash)/.test(n) ? 40 : 0) +
        (/(pro)/.test(n) ? 30 : 0);
      const sorted = filtered.sort((a, b) => score(b) - score(a));
      const dynamicCandidates = sorted.slice(0, 6);

      if (dynamicCandidates.length) {
        const secondTry = await tryModels(dynamicCandidates);
        if (secondTry.ok) {
          // Add disclaimer if no sources found
          let finalAnswer = secondTry.text;
          if (sources.length === 0) {
            finalAnswer += "\n\n💡 **Note:** This information wasn't found in our product catalog or store policies. For the most accurate information, please contact our staff at (555) 123-4567.";
          }
          
          return NextResponse.json({
            answer: finalAnswer,
            sources: sources.length > 0 ? sources : undefined,
            modelUsed: secondTry.model,
          });
        }
        return NextResponse.json(
          {
            error: "Gemini API error",
            details: secondTry.error || firstTry.error,
          },
          { status: 502 }
        );
      }
      return NextResponse.json(
        {
          error: "Gemini API error",
          details: firstTry.error || "No models returned by list API",
        },
        { status: 502 }
      );
    } catch (e: any) {
      return NextResponse.json(
        {
          error: "Gemini API error",
          details: firstTry.error || String(e?.message || e),
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("Chat API error:", error);
    
    // Provide more detailed error messages
    let errorMessage = "Failed to generate response. Please try again.";
    if (error.message?.includes("API key")) {
      errorMessage = "API configuration error. Please contact support.";
    } else if (error.message?.includes("quota")) {
      errorMessage = "Service temporarily unavailable. Please try again in a moment.";
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
