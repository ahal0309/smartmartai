import { BaseScraper, ScrapedProduct } from './scrapers/base-scraper';
import { WalmartScraper } from './scrapers/walmart-scraper';
import { ApiScraper, OpenFoodFactsScraper } from './scrapers/api-scraper';
import { CsvScraper } from './scrapers/csv-scraper';
import Product from '@/models/Product';
import { connectToDatabase } from './db';

export type ScraperType = 'walmart' | 'api' | 'csv' | 'openfoodfacts';

export interface AisleMapping {
  [category: string]: string;
}

// Default category to aisle mapping
export const DEFAULT_AISLE_MAPPING: AisleMapping = {
  dairy: 'A2',
  bakery: 'A1',
  eggs: 'A3',
  cheese: 'A4',
  grains: 'B2',
  pasta: 'B1',
  snacks: 'B3',
  condiments: 'B4',
  personal_care: 'C2',
  household: 'C4',
  baking: 'D1',
  cooking: 'D3',
  spices: 'D4',
  beverages: 'E2',
  breakfast: 'C3',
  cleaning: 'I1',
  produce: 'J1',
  legumes: 'H1',
  sweets: 'G3',
  frozen: 'F1',
  general: 'J4',
};

export class ScraperManager {
  private scrapers: Map<ScraperType, BaseScraper> = new Map();
  private aisleMapping: AisleMapping;

  constructor(aisleMapping: AisleMapping = DEFAULT_AISLE_MAPPING) {
    this.aisleMapping = aisleMapping;
    this.initializeScrapers();
  }

  private initializeScrapers() {
    this.scrapers.set('walmart', new WalmartScraper());
    this.scrapers.set('openfoodfacts', new OpenFoodFactsScraper());
    this.scrapers.set('csv', new CsvScraper());
  }

  /**
   * Register a custom API scraper
   */
  registerApiScraper(name: string, baseUrl: string, apiKey?: string) {
    const scraper = new ApiScraper(baseUrl, apiKey);
    scraper.name = name;
    this.scrapers.set('api', scraper);
  }

  /**
   * Get a scraper by type
   */
  getScraper(type: ScraperType): BaseScraper | undefined {
    return this.scrapers.get(type);
  }

  /**
   * Scrape products from a source
   */
  async scrape(
    type: ScraperType,
    options?: any
  ): Promise<{ success: boolean; products: ScrapedProduct[]; errors: string[] }> {
    const scraper = this.getScraper(type);
    if (!scraper) {
      return {
        success: false,
        products: [],
        errors: [`Scraper type "${type}" not found`],
      };
    }

    try {
      const products = await scraper.scrapeProducts(options);
      return {
        success: true,
        products,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        products: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Assign aisles to products based on category mapping
   */
  assignAisles(products: ScrapedProduct[]): Array<ScrapedProduct & { aisle: string }> {
    return products.map(product => ({
      ...product,
      aisle: this.aisleMapping[product.category] || this.aisleMapping.general || 'J4',
    }));
  }

  /**
   * Save scraped products to database
   */
  async saveToDatabase(
    products: ScrapedProduct[],
    options?: {
      updateExisting?: boolean;
      source?: string;
    }
  ): Promise<{ saved: number; updated: number; errors: string[] }> {
    await connectToDatabase();

    const productsWithAisles = this.assignAisles(products);
    let saved = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const product of productsWithAisles) {
      try {
        const existing = await Product.findOne({ 
          $or: [
            { name: product.name },
            ...(product.sku ? [{ sku: product.sku }] : []),
            ...(product.barcode ? [{ barcode: product.barcode }] : []),
          ]
        });

        if (existing) {
          if (options?.updateExisting) {
            await Product.updateOne(
              { _id: existing._id },
              {
                $set: {
                  ...product,
                  lastScraped: new Date(),
                  source: options?.source || 'scraped',
                },
              }
            );
            updated++;
          }
        } else {
          await Product.create({
            ...product,
            lastScraped: new Date(),
            source: options?.source || 'scraped',
          });
          saved++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to save "${product.name}": ${errorMsg}`);
      }
    }

    return { saved, updated, errors };
  }

  /**
   * Get all products from database and sync with RAG knowledge base
   */
  async syncWithKnowledgeBase(): Promise<{
    products: Record<string, any>;
    count: number;
  }> {
    await connectToDatabase();

    const products = await Product.find({ inStock: true }).lean();
    const knowledgeBase: Record<string, any> = {};

    products.forEach(product => {
      const key = product.name.toLowerCase().replace(/\s+/g, '_');
      knowledgeBase[key] = {
        aisle: product.aisle,
        category: product.category,
        description: product.description,
        price: product.price,
        brand: product.brand,
      };
    });

    return {
      products: knowledgeBase,
      count: products.length,
    };
  }
}

// Singleton instance
let scraperManager: ScraperManager | null = null;

export function getScraperManager(): ScraperManager {
  if (!scraperManager) {
    scraperManager = new ScraperManager();
  }
  return scraperManager;
}
