/**
 * Currency formatting utilities for Taksu Owner Portal
 * Handles USD, EUR, AUD, GBP, SGD — the payout currencies
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  AUD: 'A$',
  GBP: '£',
  SGD: 'S$',
  IDR: 'Rp',
};

export const SYSTEM_CURRENCY = process.env.NEXT_PUBLIC_BASE_CURRENCY || 'IDR';

interface FormatCurrencyOptions {
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  compact?: boolean;
}

/**
 * Format a number as currency
 * @example formatCurrency(1374.48) → "Rp 1,374.48" (or $ depending on SYSTEM_CURRENCY)
 * @example formatCurrency(1374.48, { currency: 'EUR' }) → "€1,374.48"
 */
export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    currency = SYSTEM_CURRENCY,
    minimumFractionDigits,
    maximumFractionDigits,
    compact = false,
  } = options;

  // Use 0 fraction digits for IDR by default, 2 for others
  const defaultMinFrac = currency === 'IDR' ? 0 : 2;
  const defaultMaxFrac = currency === 'IDR' ? 0 : 2;
  
  const finalMinFrac = minimumFractionDigits ?? defaultMinFrac;
  const finalMaxFrac = maximumFractionDigits ?? defaultMaxFrac;

  if (compact && Math.abs(amount) >= 1000) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    });
    return formatter.format(amount);
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: finalMinFrac,
    maximumFractionDigits: finalMaxFrac,
  });

  return formatter.format(amount);
}

/**
 * Format IDR (Indonesian Rupiah) amounts
 * @example formatIDR(2500000) → "Rp 2,500,000"
 */
export function formatIDR(amount: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(amount))}`;
}

/**
 * Format a percentage
 * @example formatPercent(0.6129) → "61.3%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Get currency symbol
 * @example getCurrencySymbol('USD') → "$"
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

/**
 * Format a number with tabular number formatting (for financial tables)
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
