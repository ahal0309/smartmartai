import { NextRequest, NextResponse } from 'next/server';
import { getScraperManager, ScraperType } from '@/lib/scraper-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, options, saveToDb, updateExisting } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Scraper type is required' },
        { status: 400 }
      );
    }

    const manager = getScraperManager();

    // Scrape products
    console.log(`[Scraper API] Starting scrape: ${type}`);
    const scrapeResult = await manager.scrape(type as ScraperType, options);

    if (!scrapeResult.success) {
      return NextResponse.json(
        { 
          error: 'Scraping failed',
          details: scrapeResult.errors,
        },
        { status: 500 }
      );
    }

    const response: any = {
      success: true,
      scraped: scrapeResult.products.length,
      products: scrapeResult.products,
    };

    // Optionally save to database
    if (saveToDb) {
      console.log(`[Scraper API] Saving ${scrapeResult.products.length} products to database`);
      const saveResult = await manager.saveToDatabase(scrapeResult.products, {
        updateExisting,
        source: type,
      });

      response.saved = saveResult.saved;
      response.updated = saveResult.updated;
      response.saveErrors = saveResult.errors;
    }

    console.log(`[Scraper API] Complete:`, response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('[Scraper API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    const manager = getScraperManager();

    if (action === 'sync') {
      // Sync products from database to knowledge base format
      const result = await manager.syncWithKnowledgeBase();
      return NextResponse.json({
        success: true,
        count: result.count,
        products: result.products,
      });
    }

    // Default: return available scrapers
    return NextResponse.json({
      success: true,
      scrapers: [
        {
          type: 'walmart',
          name: 'Walmart',
          description: 'Scrape products from Walmart (demo/mock)',
        },
        {
          type: 'openfoodfacts',
          name: 'Open Food Facts',
          description: 'Free, open database of food products',
        },
        {
          type: 'csv',
          name: 'CSV Import',
          description: 'Import products from CSV file',
        },
        {
          type: 'api',
          name: 'Custom API',
          description: 'Connect to custom product API',
        },
      ],
    });

  } catch (error) {
    console.error('[Scraper API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
