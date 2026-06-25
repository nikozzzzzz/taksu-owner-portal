import { formatCurrency, formatIDR, formatPercent, getCurrencySymbol, formatNumber } from '@/lib/utils/currency';

describe('Currency Utils', () => {
  it('formats currency default (USD)', () => {
    // Note: Intl.NumberFormat might include narrow no-break space or non-breaking space depending on node version,
    // so we use regex or strip spaces if we want a precise match, but typically for en-US it's straight up "$1,374.48".
    const result = formatCurrency(1374.48);
    expect(result.replace(/\s/g, '')).toBe('$1,374.48');
  });
  
  it('formats currency EUR', () => {
    const result = formatCurrency(1374.48, { currency: 'EUR' });
    expect(result.replace(/\s/g, '')).toBe('€1,374.48');
  });

  it('formats compact currency', () => {
    const result = formatCurrency(1500, { compact: true });
    expect(result).toBe('$1.5K');
  });

  it('formats IDR correctly', () => {
    const result = formatIDR(2500000);
    // id-ID format might use . for thousands
    expect(result).toMatch(/Rp\s2[.,]500[.,]000/);
  });

  it('formats percentages', () => {
    expect(formatPercent(0.6129)).toBe('61.3%');
    expect(formatPercent(0.6129, 2)).toBe('61.29%');
  });

  it('gets correct currency symbols', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('EUR')).toBe('€');
    expect(getCurrencySymbol('UNKNOWN')).toBe('UNKNOWN');
  });

  it('formats numbers', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56');
  });
});
