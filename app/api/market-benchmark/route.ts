import { NextResponse } from 'next/server';
import { MARKET_BENCHMARKS } from '@/lib/calculations/analytics-calc';

// Define the region mapping for RapidAPI / external API search queries
const REGION_QUERY_MAP: Record<string, string> = {
  ubud: 'Ubud, Bali, Indonesia',
  canggu: 'Canggu, Bali, Indonesia',
  seminyak: 'Seminyak, Bali, Indonesia',
  uluwatu: 'Uluwatu, Bali, Indonesia',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'ubud';

  const rapidApiKey = process.env.RAPIDAPI_KEY;

  // If no API key is provided, gracefully fallback to our mock benchmarks
  if (!rapidApiKey) {
    console.log('[Market Benchmark API] No RAPIDAPI_KEY found. Using fallback mock data.');
    const fallbackData = MARKET_BENCHMARKS[region] || MARKET_BENCHMARKS['ubud'];
    return NextResponse.json({
      data: fallbackData,
      source: 'mock',
      message: 'Set RAPIDAPI_KEY in your environment to fetch live data.'
    });
  }

  const locationQuery = REGION_QUERY_MAP[region] || 'Bali, Indonesia';

  try {
    // We are integrating with a typical Airbnb Market Data API on RapidAPI.
    // Example: Airbtics or AirDNA via RapidAPI which provides ADR, RevPAR, and Occupancy.
    // Note: The specific host 'airbnb-market-data.p.rapidapi.com' is a placeholder for 
    // the chosen RapidAPI provider (like Airbtics).
    const response = await fetch(`https://airbnb-market-data.p.rapidapi.com/market/insights?location=${encodeURIComponent(locationQuery)}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'airbnb-market-data.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      }
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    // Process the result to map to our expected format
    // (Assuming the API returns { adr: 120, revpar: 80, occupancy: 0.66 })
    const marketData = {
      name: region.charAt(0).toUpperCase() + region.slice(1),
      occupancy: result.occupancy || 0,
      adr_usd: result.adr || 0,
      revpar_usd: result.revpar || 0,
    };

    return NextResponse.json({
      data: marketData,
      source: 'live'
    });

  } catch (error) {
    console.error('[Market Benchmark API] Error fetching live data:', error);
    // Fallback to mock data on error so the UI doesn't break
    const fallbackData = MARKET_BENCHMARKS[region] || MARKET_BENCHMARKS['ubud'];
    return NextResponse.json({
      data: fallbackData,
      source: 'error_fallback',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
