import { BaseScraper, ScrapedProduct } from './base-scraper';

/**
 * CSV file scraper for importing product data from CSV files
 * Useful for bulk imports from suppliers or existing databases
 */
export class CsvScraper extends BaseScraper {
  name = 'CSV Scraper';
  baseUrl = 'file://';

  async scrapeProducts(options?: { 
    csvText?: string;
    filePath?: string;
  }): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];

    try {
      let csvText = options?.csvText;

      // If file path provided (server-side only)
      if (options?.filePath && !csvText) {
        // In Node.js environment
        if (typeof window === 'undefined') {
          const fs = await import('fs/promises');
          csvText = await fs.readFile(options.filePath, 'utf-8');
        }
      }

      if (!csvText) {
        throw new Error('No CSV data provided');
      }

      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }

      // Parse header
      const headers = this.parseCsvLine(lines[0]);
      console.log(`[${this.name}] Found headers:`, headers);

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCsvLine(lines[i]);
        if (values.length !== headers.length) {
          console.warn(`[${this.name}] Line ${i + 1}: Column count mismatch`);
          continue;
        }

        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header.toLowerCase().trim()] = values[idx].trim();
        });

        const normalized = this.normalizeProduct({
          name: row.name || row.product_name || row.title,
          sku: row.sku || row.id || row.code,
          category: row.category || row.type || 'general',
          description: row.description || row.desc || row.name,
          price: row.price ? parseFloat(row.price) : undefined,
          imageUrl: row.image_url || row.image,
          inStock: row.in_stock?.toLowerCase() !== 'false' && row.in_stock !== '0',
          externalUrl: row.url || row.external_url,
          barcode: row.barcode || row.ean || row.upc,
          brand: row.brand || row.manufacturer,
        });

        if (normalized) {
          products.push(normalized);
        }
      }

      console.log(`[${this.name}] Parsed ${products.length} products from ${lines.length - 1} rows`);
      return products;

    } catch (error) {
      console.error(`[${this.name}] CSV parsing error:`, error);
      return products;
    }
  }

  /**
   * Parse a CSV line handling quoted values
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }
}

/**
 * Example CSV format:
 * 
 * name,sku,category,description,price,aisle,in_stock,brand
 * "Whole Milk",MILK-001,dairy,"Fresh whole milk, 1 gallon",3.99,A2,true,Great Value
 * "White Bread",BREAD-001,bakery,"Whole wheat bread",2.49,A1,true,Wonder
 * "Large Eggs",EGGS-001,dairy,"Grade A large eggs, dozen",4.99,A3,true,Eggland's Best
 */
