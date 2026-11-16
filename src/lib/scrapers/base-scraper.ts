// Base scraper interface for different scraping strategies

export interface ScrapedProduct {
  name: string;
  sku?: string;
  category: string;
  description: string;
  price?: number;
  imageUrl?: string;
  inStock: boolean;
  externalUrl?: string;
  barcode?: string;
  brand?: string;
}

export abstract class BaseScraper {
  abstract name: string;
  abstract baseUrl: string;

  /**
   * Scrape products from the source
   * @param options - Scraping options (e.g., category filter, page number)
   */
  abstract scrapeProducts(options?: any): Promise<ScrapedProduct[]>;

  /**
   * Validate if a URL is valid for this scraper
   */
  validateUrl(url: string): boolean {
    return url.startsWith(this.baseUrl);
  }

  /**
   * Clean and normalize product data
   */
  protected normalizeProduct(product: Partial<ScrapedProduct>): ScrapedProduct | null {
    if (!product.name || !product.category) {
      return null;
    }

    return {
      name: this.cleanText(product.name),
      sku: product.sku,
      category: this.cleanText(product.category),
      description: this.cleanText(product.description || product.name),
      price: product.price,
      imageUrl: product.imageUrl,
      inStock: product.inStock ?? true,
      externalUrl: product.externalUrl,
      barcode: product.barcode,
      brand: product.brand ? this.cleanText(product.brand) : undefined,
    };
  }

  /**
   * Clean text by removing extra whitespace and trimming
   */
  protected cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Extract price from text (handles $, €, etc.)
   */
  protected extractPrice(priceText: string): number | undefined {
    const match = priceText.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return undefined;
  }

  /**
   * Rate limiting helper
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
