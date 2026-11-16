/**
 * Example usage of the product scraping system
 * These examples show how to use the scrapers programmatically
 */

import { getScraperManager } from '../src/lib/scraper-manager';

// ==========================================
// Example 1: Scrape from Open Food Facts
// ==========================================
async function example1_OpenFoodFacts() {
  const manager = getScraperManager();
  
  const result = await manager.scrape('openfoodfacts', {
    category: 'snacks',  // Category to scrape
    limit: 50            // Number of products
  });

  if (result.success) {
    console.log(`Scraped ${result.products.length} products`);
    
    // Save to database
    const saved = await manager.saveToDatabase(result.products, {
      updateExisting: true,
      source: 'openfoodfacts'
    });
    
    console.log(`Saved: ${saved.saved}, Updated: ${saved.updated}`);
  }
}

// ==========================================
// Example 2: Import from CSV
// ==========================================
async function example2_CSV() {
  const manager = getScraperManager();
  
  const csvData = `name,sku,category,description,price,in_stock,brand
"Whole Milk",MILK-001,dairy,"Fresh whole milk, 1 gallon",3.99,true,Great Value
"White Bread",BREAD-001,bakery,"Whole wheat bread",2.49,true,Wonder
"Large Eggs",EGGS-001,dairy,"Grade A large eggs, dozen",4.99,true,Eggland's Best
"Basmati Rice",RICE-001,grains,"Premium basmati rice, 5lb",8.99,true,Royal
"Pasta Sauce",SAUCE-001,condiments,"Marinara pasta sauce, 24oz",2.99,true,Prego`;

  const result = await manager.scrape('csv', {
    csvText: csvData
  });

  if (result.success) {
    const saved = await manager.saveToDatabase(result.products);
    console.log(`Imported ${saved.saved} products from CSV`);
  }
}

// ==========================================
// Example 3: Custom API Integration
// ==========================================
async function example3_CustomAPI() {
  const manager = getScraperManager();
  
  // Register your store's API
  manager.registerApiScraper(
    'MyStore',
    'https://api.mystore.com',
    'your-api-key-here'
  );

  const result = await manager.scrape('api', {
    endpoint: '/v1/products',
    category: 'electronics',
    limit: 100
  });

  if (result.success) {
    const saved = await manager.saveToDatabase(result.products, {
      updateExisting: true,
      source: 'mystore-api'
    });
    console.log(`Synced ${saved.saved + saved.updated} products`);
  }
}

// ==========================================
// Example 4: Batch Processing
// ==========================================
async function example4_BatchProcessing() {
  const manager = getScraperManager();
  const categories = ['dairy', 'bakery', 'snacks', 'beverages', 'cleaning'];
  
  let totalProducts = 0;
  
  for (const category of categories) {
    console.log(`Processing category: ${category}`);
    
    const result = await manager.scrape('openfoodfacts', {
      category,
      limit: 20
    });

    if (result.success) {
      const saved = await manager.saveToDatabase(result.products);
      totalProducts += saved.saved + saved.updated;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`Total products processed: ${totalProducts}`);
}

// ==========================================
// Example 5: Sync to RAG Knowledge Base
// ==========================================
async function example5_SyncToRAG() {
  const manager = getScraperManager();
  
  // Get all products from database and format for RAG
  const { products, count } = await manager.syncWithKnowledgeBase();
  
  console.log(`Synced ${count} products to knowledge base`);
  console.log('Sample entries:', Object.keys(products).slice(0, 5));
  
  // The chatbot can now answer questions like:
  // "Where can I find milk?" → "Aisle A2"
  // "What dairy products do you have?" → Lists all dairy items
}

// ==========================================
// Example 6: Custom Aisle Mapping
// ==========================================
async function example6_CustomAisleMapping() {
  const { ScraperManager } = await import('../src/lib/scraper-manager');
  
  // Define your own category → aisle mapping
  const customMapping = {
    dairy: 'A1',
    bakery: 'A2',
    meat: 'B1',
    seafood: 'B2',
    frozen: 'C1',
    // ... etc
  };
  
  const manager = new ScraperManager(customMapping);
  
  // Now all scraped products will use your custom mapping
  const result = await manager.scrape('openfoodfacts', {
    category: 'dairy',
    limit: 10
  });
  
  const withAisles = manager.assignAisles(result.products);
  console.log('Products with custom aisles:', withAisles);
}

// ==========================================
// Example 7: Product CRUD via API
// ==========================================
async function example7_ProductAPI() {
  // Create a product
  const createResponse = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Organic Honey',
      category: 'condiments',
      aisle: 'B4',
      description: 'Pure organic honey, 16oz',
      price: 9.99,
      inStock: true,
      brand: 'Nature Nate'
    })
  });
  
  const created = await createResponse.json();
  console.log('Created product:', created.product);
  
  // Search products
  const searchResponse = await fetch('/api/products?search=honey&category=condiments');
  const searchResults = await searchResponse.json();
  console.log('Found products:', searchResults.products);
  
  // Update product
  const updateResponse = await fetch('/api/products', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      _id: created.product._id,
      price: 8.99,  // Price drop!
      inStock: true
    })
  });
  
  // Delete product
  await fetch(`/api/products?id=${created.product._id}`, {
    method: 'DELETE'
  });
}

// ==========================================
// Example 8: File Upload (Client-side)
// ==========================================
async function example8_FileUpload() {
  // In a React component:
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const text = await file.text();
    
    const response = await fetch('/api/scraper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'csv',
        options: { csvText: text },
        saveToDb: true
      })
    });
    
    const result = await response.json();
    console.log(`Imported ${result.saved} products from file`);
  };
  
  // <input type="file" accept=".csv" onChange={handleFileUpload} />
}

// ==========================================
// Export examples
// ==========================================
export {
  example1_OpenFoodFacts,
  example2_CSV,
  example3_CustomAPI,
  example4_BatchProcessing,
  example5_SyncToRAG,
  example6_CustomAisleMapping,
  example7_ProductAPI,
  example8_FileUpload
};
