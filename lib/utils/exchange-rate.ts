let cachedRates: Record<string, number> | null = null;
let lastFetched = 0;

const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  IDR: 15500,
  EUR: 0.92,
  AUD: 1.5,
  GBP: 0.78,
  SGD: 1.34,
};

export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  // Cache for 1 hour
  if (cachedRates && (now - lastFetched < 3600000)) {
    return cachedRates;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.rates && typeof data.rates.IDR === 'number') {
        cachedRates = data.rates;
        lastFetched = now;
        return data.rates;
      }
    }
  } catch (err) {
    console.error('[ExchangeRate] Failed to fetch latest exchange rates, using fallback:', err);
  }

  return cachedRates || FALLBACK_RATES;
}

export async function convertToUsd(amount: number, fromCurrency: string): Promise<number> {
  if (!amount || isNaN(amount)) return 0;
  const currency = (fromCurrency || 'USD').toUpperCase();
  if (currency === 'USD') return amount;

  const rates = await getExchangeRates();
  const rate = rates[currency] || FALLBACK_RATES[currency];

  if (!rate) {
    console.warn(`[ExchangeRate] No exchange rate found for ${currency}, returning amount as USD`);
    return amount;
  }

  return amount / rate;
}
