import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';
import type { Database } from '@/lib/supabase/types';

// Register fonts if needed, using standard fonts for now
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff', fontWeight: 600 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica', // Using Helvetica for safe fallback, 'Inter' can be used if fonts are properly loaded
    fontSize: 10,
    color: '#2C3E2C', // taksu-forest
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#D4C5A0', // taksu-sand
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7B6B', // taksu-sage
    marginTop: 4,
  },
  companyInfo: {
    textAlign: 'right',
  },
  companyName: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  ownerInfo: {
    marginBottom: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#F2EDE0', // taksu-parchment
    padding: 6,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  rowIndent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingLeft: 15,
    color: '#6B7B6B',
  },
  rowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    fontWeight: 'bold',
    marginTop: 4,
  },
  rowHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    fontWeight: 'bold',
    backgroundColor: '#E6EFE6', // Light taksu-jungle tint
    paddingHorizontal: 6,
    marginTop: 10,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 30,
    gap: 10,
  },
  kpiBox: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D4C5A0',
    borderRadius: 4,
    textAlign: 'center',
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#6B7B6B',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#D4C5A0',
    paddingTop: 10,
  },
});

type StatementRow = Database['public']['Tables']['monthly_statements']['Row'] & {
  villas?: {
    display_name: string;
    internal_code: string;
  } | null;
  owners?: {
    full_name: string;
    email: string;
    tax_residency_country: string;
  } | null;
};

interface StatementPdfProps {
  statement: StatementRow;
}

export function StatementPdf({ statement }: StatementPdfProps) {
  const date = new Date(statement.billing_month);
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const opexBreakdown = statement.opex_breakdown as Record<string, { amount: number, items: number }>;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Monthly Statement</Text>
            <Text style={styles.subtitle}>{monthName}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>PT Taksu Living Management</Text>
            <Text>Jl. Penestanan Kelod, Ubud</Text>
            <Text>Bali, Indonesia 80571</Text>
            <Text>NPWP: 00.000.000.0-000.000</Text>
          </View>
        </View>

        {/* Owner & Villa Info */}
        <View style={styles.ownerInfo}>
          <Text style={{ fontWeight: 'bold' }}>Prepared For:</Text>
          <Text>{statement.owners?.full_name}</Text>
          <Text>{statement.owners?.email}</Text>
          <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Property:</Text>
          <Text>{statement.villas?.display_name} ({statement.villas?.internal_code})</Text>
        </View>

        {/* KPIs */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiBox}>
            <Text>Occupancy</Text>
            <Text style={styles.kpiValue}>{formatPercent(statement.occupancy_rate)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text>ADR</Text>
            <Text style={styles.kpiValue}>{statement.adr_usd ? formatCurrency(statement.adr_usd) : '—'}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text>Nights Booked</Text>
            <Text style={styles.kpiValue}>{statement.occupied_nights}</Text>
          </View>
        </View>

        {/* Revenue Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Revenue</Text>
          <View style={styles.row}>
            <Text>Gross Booking Revenue</Text>
            <Text>{formatCurrency(statement.gross_revenue_usd)}</Text>
          </View>
          <View style={styles.rowIndent}>
            <Text>Less: Channel Commissions</Text>
            <Text>- {formatCurrency(statement.channel_commission_usd)}</Text>
          </View>
          <View style={styles.rowIndent}>
            <Text>Less: PHR Tax (10%)</Text>
            <Text>- {formatCurrency(statement.phr_tax_usd)}</Text>
          </View>
          <View style={styles.rowTotal}>
            <Text>Net Villa Revenue</Text>
            <Text>{formatCurrency(statement.net_revenue_usd)}</Text>
          </View>
        </View>

        {/* Expenses Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Operating Expenses</Text>
          {Object.entries(opexBreakdown).map(([category, data]) => (
            <View style={styles.rowIndent} key={category}>
              <Text>{category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
              <Text>{formatCurrency(data.amount)}</Text>
            </View>
          ))}
          {Object.keys(opexBreakdown).length === 0 && (
            <View style={styles.rowIndent}>
              <Text>No operating expenses</Text>
              <Text>$0.00</Text>
            </View>
          )}
          <View style={styles.rowTotal}>
            <Text>Total Operating Expenses</Text>
            <Text>{formatCurrency(statement.total_opex_usd)}</Text>
          </View>
        </View>

        {/* Profit & Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Profit & Distribution</Text>
          <View style={styles.row}>
            <Text>Net Operating Profit</Text>
            <Text>{formatCurrency(statement.net_profit_usd)}</Text>
          </View>
          <View style={styles.rowIndent}>
            <Text>Less: Management Fee ({formatPercent(statement.management_fee_rate)})</Text>
            <Text>- {formatCurrency(statement.management_fee_usd)}</Text>
          </View>
          <View style={styles.rowTotal}>
            <Text>Gross Owner Payout</Text>
            <Text>{formatCurrency(statement.owner_gross_payout_usd)}</Text>
          </View>
          <View style={styles.rowIndent}>
            <Text>Less: PPh 26 Withholding Tax ({formatPercent(statement.pph26_rate)})</Text>
            <Text>- {formatCurrency(statement.pph26_amount_usd)}</Text>
          </View>
          
          <View style={styles.rowHighlight}>
            <Text>Net Owner Payout</Text>
            <Text>{formatCurrency(statement.owner_net_payout_usd)}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          This is an automatically generated document. For questions regarding this statement, please contact portal@taksuliving.com
        </Text>
      </Page>
    </Document>
  );
}
