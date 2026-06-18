/**
 * PPh 26 tax rates by country code (ISO 3166-1 alpha-2)
 * Based on Indonesia's Double Tax Agreements (DTA)
 */

export const DEFAULT_PPH26_RATE = 0.20; // 20% without DGT-1

export const DTA_RATES_BY_COUNTRY: Record<string, number> = {
  // Western Europe
  DE: 0.10, // Germany
  FR: 0.10, // France
  NL: 0.10, // Netherlands
  BE: 0.10, // Belgium
  IT: 0.15, // Italy
  ES: 0.10, // Spain
  AT: 0.10, // Austria
  CH: 0.10, // Switzerland
  SE: 0.15, // Sweden
  NO: 0.15, // Norway
  DK: 0.15, // Denmark
  FI: 0.15, // Finland

  // UK & Ireland
  GB: 0.15, // United Kingdom
  IE: 0.10, // Ireland

  // North America
  US: 0.15, // United States
  CA: 0.15, // Canada

  // Oceania
  AU: 0.15, // Australia
  NZ: 0.15, // New Zealand

  // Asia
  SG: 0.15, // Singapore
  HK: 0.10, // Hong Kong
  JP: 0.10, // Japan
  KR: 0.15, // South Korea
  CN: 0.10, // China
  TW: 0.15, // Taiwan
  MY: 0.15, // Malaysia
  TH: 0.15, // Thailand
  VN: 0.15, // Vietnam

  // CIS / Russia
  RU: 0.15, // Russia
  KZ: 0.15, // Kazakhstan
  BY: 0.15, // Belarus
  UA: 0.15, // Ukraine
};

/**
 * Get the applicable PPh 26 rate for an investor
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @param hasDgt1 Whether the investor has a valid DGT-1 form
 */
export function getPph26Rate(countryCode: string, hasDgt1: boolean): number {
  if (!hasDgt1) return DEFAULT_PPH26_RATE;
  return DTA_RATES_BY_COUNTRY[countryCode.toUpperCase()] ?? DEFAULT_PPH26_RATE;
}

/**
 * Calculate potential monthly savings with DGT-1
 * @param monthlyRevenue Average monthly owner gross payout
 * @param countryCode Investor's country code
 */
export function calculateDgt1Savings(monthlyRevenue: number, countryCode: string): number {
  const withoutDgt1 = monthlyRevenue * DEFAULT_PPH26_RATE;
  const withDgt1Rate = DTA_RATES_BY_COUNTRY[countryCode.toUpperCase()] ?? DEFAULT_PPH26_RATE;
  const withDgt1 = monthlyRevenue * withDgt1Rate;
  return Math.max(0, withoutDgt1 - withDgt1);
}
