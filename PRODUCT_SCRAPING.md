# Product Scraping System

## Overview

The Smart Cart application now includes a comprehensive product scraping system that allows you to import products from various sources including:

1. **Open Food Facts** - Free, open database of food products
2. **Custom APIs** - Connect to any REST API
3. **CSV Import** - Bulk import from CSV files
4. **Web Scrapers** - Custom scrapers for retail sites (demo)

## Architecture

### Models

**`src/models/Product.ts`**
- MongoDB schema for storing product information
- Fields: name, sku, aisle, category, description, price, imageUrl, inStock, lastScraped, source, barcode, brand, tags
- Indexes for efficient searching (text search, category filtering)

### Scrapers

All scrapers inherit from `BaseScraper` class:

**`src/lib/scrapers/base-scraper.ts`**
- Abstract base class defining scraper interface
- Common utilities: text cleaning, price extraction, rate limiting
- Product normalization and validation

**`src/lib/scrapers/walmart-scraper.ts`**
- Example web scraper (mock data for demo)
- Shows structure for HTML scraping
- In production, use libraries like Cheerio or Puppeteer

**`src/lib/scrapers/api-scraper.ts`**
- Generic API scraper for REST endpoints
- Includes Open Food Facts implementation
- Configurable with API keys and custom endpoints

**`src/lib/scrapers/csv-scraper.ts`**
- Import products from CSV files
- Handles quoted values and various formats
- Required columns: name, category

### Manager

**`src/lib/scraper-manager.ts`**
- Central manager for all scrapers
- Handles scraping, aisle assignment, database storage
- Syncs products to RAG knowledge base
- Automatic category-to-aisle mapping

### API Routes

**`/api/scraper`**
- POST: Start scraping from a source
- GET: List available scrapers or sync knowledge base

**`/api/products`**
- GET: Fetch products with filtering (category, search, stock)
- POST: Create new product
- PUT: Update existing product
- DELETE: Remove product

### UI

**`/owner/product-scraper`**
- Owner-only page for product scraping
- Select scraper type
- Configure options
- View results
- Sync to knowledge base

## Usage

### 1. Scrape Products from Open Food Facts

```typescript
// Navigate to /owner/product-scraper
// Select "Open Food Facts"
// Click "Start Scraping"

// Or via API:
const response = await fetch('/api/scraper', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'openfoodfacts',
    options: {
      category: 'snacks',
      limit: 50
    },
    saveToDb: true,
    updateExisting: true
  })
});
```

### 2. Import from CSV

```typescript
const csvData = `name,sku,category,description,price,in_stock,brand
"Organic Milk",MILK-002,dairy,"Organic whole milk",5.99,true,Horizon
"Sourdough Bread",BREAD-002,bakery,"Artisan sourdough",4.49,true,Boudin`;

const response = await fetch('/api/scraper', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'csv',
    options: { csvText: csvData },
    saveToDb: true
  })
});
```

### 3. Connect to Custom API

```typescript
import { getScraperManager } from '@/lib/scraper-manager';

const manager = getScraperManager();
manager.registerApiScraper(
  'mystore',
  'https://api.mystore.com',
  'your-api-key'
);

const result = await manager.scrape('api', {
  endpoint: '/products',
  category: 'electronics'
});
```

### 4. Sync to Knowledge Base

After scraping products, sync them to the RAG knowledge base:

```typescript
const response = await fetch('/api/scraper?action=sync');
const data = await response.json();
// { products: {...}, count: 123 }
```

This makes products available to the chatbot for customer queries.

## Category to Aisle Mapping

Products are automatically assigned to aisles based on their category:

```typescript
const DEFAULT_AISLE_MAPPING = {
  dairy: 'A2',
  bakery: 'A1',
  eggs: 'A3',
  cheese: 'A4',
  grains: 'B2',
  pasta: 'B1',
  snacks: 'B3',
  // ... etc
};
```

You can customize this mapping by passing a custom mapping to `ScraperManager`.

## CSV Format

Required columns: `name`, `category`

Optional columns: `sku`, `description`, `price`, `in_stock`, `brand`, `image_url`, `barcode`

Example:
```csv
name,sku,category,description,price,in_stock,brand
"Whole Milk",MILK-001,dairy,"Fresh whole milk, 1 gallon",3.99,true,Great Value
"White Bread",BREAD-001,bakery,"Whole wheat bread",2.49,true,Wonder
```

## Adding Custom Scrapers

Create a new scraper by extending `BaseScraper`:

```typescript
import { BaseScraper, ScrapedProduct } from './base-scraper';

export class MyCustomScraper extends BaseScraper {
  name = 'My Store';
  baseUrl = 'https://mystore.com';

  async scrapeProducts(options?: any): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    
    // Your scraping logic here
    const response = await fetch(`${this.baseUrl}/products`);
    const data = await response.json();
    
    for (const item of data) {
      const normalized = this.normalizeProduct({
        name: item.title,
        category: item.category,
        description: item.description,
        price: item.price,
        // ... etc
      });
      
      if (normalized) {
        products.push(normalized);
      }
    }
    
    return products;
  }
}
```

Then register it:

```typescript
import { MyCustomScraper } from './scrapers/my-custom-scraper';

const manager = getScraperManager();
manager.scrapers.set('mycustom', new MyCustomScraper());
```

## Best Practices

### Rate Limiting
- Always implement rate limiting when scraping
- Use `await this.delay(ms)` between requests
- Respect `robots.txt` and terms of service

### Error Handling
- Wrap scraping logic in try-catch blocks
- Log errors for debugging
- Return partial results on errors

### Data Quality
- Validate and normalize data
- Check for required fields
- Remove duplicates
- Clean text (whitespace, special chars)

### Legal Compliance
- Read and comply with website terms of service
- Some sites prohibit scraping
- Consider using official APIs when available
- Open Food Facts is explicitly open and free to use

### Performance
- Limit concurrent requests
- Use bulk database operations
- Cache results when possible
- Process in batches for large datasets

## Integration with RAG

Products scraped into the database can be synced to the RAG knowledge base:

1. Products are stored in MongoDB
2. Call `/api/scraper?action=sync` to sync
3. Products are formatted for the knowledge base
4. Chatbot can now answer questions about products

The sync creates entries like:

```typescript
{
  organic_milk: {
    aisle: "A2",
    category: "dairy",
    description: "Organic whole milk, 1 gallon",
    price: 5.99,
    brand: "Horizon"
  }
}
```

## Future Enhancements

- [ ] Real-time scraping with webhooks
- [ ] Scheduled scraping (cron jobs)
- [ ] Image processing and OCR
- [ ] Barcode scanning integration
- [ ] Multi-language support
- [ ] Product matching and deduplication
- [ ] Price tracking and alerts
- [ ] Automatic category classification using AI
- [ ] Supplier API integrations
- [ ] Bulk edit tools

## Troubleshooting

**"Module not found" errors**
- Run `npm install` to ensure dependencies are installed
- Check that MongoDB connection string is set in `.env.local`

**Scraping returns empty results**
- Check API endpoint availability
- Verify API key if required
- Check rate limiting and retry logic
- Look for errors in console logs

**Products not appearing in chatbot**
- Run sync: `GET /api/scraper?action=sync`
- Verify products are in database
- Check MongoDB connection
- Ensure products have `inStock: true`

**CSV import fails**
- Verify CSV format (comma-separated)
- Check required columns: name, category
- Ensure proper quoting for values with commas
- Check for encoding issues (UTF-8 recommended)

## Example Workflow

1. **Owner logs in** → Navigate to Product Scraper page
2. **Select source** → Choose Open Food Facts
3. **Configure options** → Select category: "snacks", limit: 20
4. **Start scraping** → Products are fetched and saved to database
5. **Review results** → See 20 products scraped, 15 new, 5 updated
6. **Sync to knowledge base** → Click "Sync to Knowledge Base"
7. **Test chatbot** → Customer asks "Where can I find granola bars?"
8. **Chatbot responds** → "Granola bars are in Aisle B3 (snacks section)"

---

**Status**: ✅ Production Ready (with proper API keys and rate limiting)
