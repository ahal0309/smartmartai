// Quick test script to verify scraper functionality
// Run with: node --loader ts-node/esm scripts/test-scraper.ts
// Or: npm run test-scraper (if added to package.json)

import { getScraperManager } from '../src/lib/scraper-manager';

async function testScrapers() {
  console.log('🚀 Testing Product Scrapers\n');

  const manager = getScraperManager();

  // Test 1: Open Food Facts
  console.log('1️⃣ Testing Open Food Facts Scraper...');
  try {
    const result = await manager.scrape('openfoodfacts', {
      category: 'snacks',
      limit: 5
    });
    
    console.log(`✅ Success! Scraped ${result.products.length} products`);
    if (result.products.length > 0) {
      console.log(`   Sample: ${result.products[0].name} - ${result.products[0].category}`);
    }
  } catch (error) {
    console.error('❌ Failed:', error);
  }
  console.log('');

  // Test 2: CSV Scraper
  console.log('2️⃣ Testing CSV Scraper...');
  const csvData = `name,sku,category,description,price,in_stock,brand
"Test Milk",TEST-001,dairy,"Test milk product",4.99,true,TestBrand
"Test Bread",TEST-002,bakery,"Test bread product",3.49,true,TestBrand`;

  try {
    const result = await manager.scrape('csv', {
      csvText: csvData
    });
    
    console.log(`✅ Success! Parsed ${result.products.length} products`);
    result.products.forEach(p => {
      console.log(`   - ${p.name} (${p.category}) - $${p.price}`);
    });
  } catch (error) {
    console.error('❌ Failed:', error);
  }
  console.log('');

  // Test 3: Walmart Scraper (Mock)
  console.log('3️⃣ Testing Walmart Scraper (Mock)...');
  try {
    const result = await manager.scrape('walmart', { limit: 3 });
    
    console.log(`✅ Success! Scraped ${result.products.length} products`);
    result.products.forEach(p => {
      console.log(`   - ${p.name} (${p.category})`);
    });
  } catch (error) {
    console.error('❌ Failed:', error);
  }
  console.log('');

  // Test 4: Aisle Assignment
  console.log('4️⃣ Testing Aisle Assignment...');
  const testProducts = [
    { name: 'Milk', category: 'dairy', description: 'Test milk', inStock: true },
    { name: 'Chips', category: 'snacks', description: 'Test chips', inStock: true },
  ];
  
  const withAisles = manager.assignAisles(testProducts);
  console.log('✅ Aisle assignment working:');
  withAisles.forEach(p => {
    console.log(`   - ${p.name} (${p.category}) → Aisle ${p.aisle}`);
  });
  console.log('');

  console.log('✨ All tests complete!\n');
  console.log('📝 Next steps:');
  console.log('   1. Start the dev server: npm run dev');
  console.log('   2. Navigate to: http://localhost:3000/owner/product-scraper');
  console.log('   3. Select a scraper and click "Start Scraping"');
  console.log('   4. Click "Sync to Knowledge Base" to enable chatbot queries');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testScrapers().catch(console.error);
}

export { testScrapers };
