import { BaseScraper, ScrapedProduct } from './base-scraper';

/**
 * Generic API-based product scraper
 * Works with stores that provide product APIs (like Open Food Facts, USDA, etc.)
 */
export class ApiScraper extends BaseScraper {
  name = 'API Scraper';
  baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    super();
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async scrapeProducts(options?: { 
    category?: string; 
    limit?: number;
    endpoint?: string;
  }): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const limit = options?.limit || 100;
    const endpoint = options?.endpoint || '/products';

    try {
      const url = new URL(endpoint, this.baseUrl);
      if (options?.category) {
        url.searchParams.set('category', options.category);
      }
      url.searchParams.set('limit', limit.toString());

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      console.log(`[${this.name}] Fetching from ${url.toString()}`);

      const response = await fetch(url.toString(), { headers });
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Adapt the response structure to your API
      const items = Array.isArray(data) ? data : data.products || data.items || [];

      for (const item of items) {
        const normalized = this.normalizeProduct({
          name: item.name || item.product_name || item.title,
          sku: item.sku || item.id || item.code,
          category: item.category || item.categories?.[0] || 'general',
          description: item.description || item.ingredients_text || '',
          price: item.price ? parseFloat(item.price) : undefined,
          imageUrl: item.image_url || item.image || item.thumbnail,
          inStock: item.in_stock ?? item.available ?? true,
          externalUrl: item.url,
          barcode: item.barcode || item.ean || item.upc,
          brand: item.brand || item.manufacturer,
        });

        if (normalized) {
          products.push(normalized);
        }
      }

      console.log(`[${this.name}] Fetched ${products.length} products`);
      return products;

    } catch (error) {
      console.error(`[${this.name}] API error:`, error);
      return products;
    }
  }
}

/**
 * Open Food Facts API scraper
 * Free, open database of food products
 */
export class OpenFoodFactsScraper extends ApiScraper {
  constructor() {
    super('https://world.openfoodfacts.org');
    this.name = 'Open Food Facts';
  }

  async scrapeProducts(options?: { category?: string; limit?: number }): Promise<ScrapedProduct[]> {
    const limit = options?.limit || 100;
    const category = options?.category || 'food';

    try {
      const url = `${this.baseUrl}/category/${category}.json?page_size=${limit}`;
      console.log(`[${this.name}] Fetching from ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const products: ScrapedProduct[] = [];

      for (const item of data.products || []) {
        const normalized = this.normalizeProduct({
          name: item.product_name || item.product_name_en,
          sku: item.code,
          category: item.categories_tags?.[0]?.replace('en:', '') || category,
          description: item.generic_name || item.product_name,
          imageUrl: item.image_url,
          inStock: true,
          externalUrl: `${this.baseUrl}/product/${item.code}`,
          barcode: item.code,
          brand: item.brands,
        });

        if (normalized && normalized.name) {
          products.push(normalized);
        }
      }

      console.log(`[${this.name}] Fetched ${products.length} products`);
      return products;

    } catch (error) {
      console.error(`[${this.name}] API error:`, error);
      return [];
    }
  }
}
