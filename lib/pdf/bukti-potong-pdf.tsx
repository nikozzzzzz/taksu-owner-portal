import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';
import type { Database } from '@/lib/supabase/types';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000000',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 10,
    marginTop: 4,
  },
  sectionBox: {
    borderWidth: 1,
    borderColor: '#000000',
    marginBottom: 15,
  },
  sectionHeader: {
    backgroundColor: '#F0F0F0',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  cellLabel: {
    width: '40%',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
  },
  cellValue: {
    width: '60%',
    padding: 4,
  },
  footer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureBox: {
    width: 200,
    textAlign: 'center',
  },
  signatureLine: {
    marginTop: 50,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 4,
  }
});

type StatementRow = Database['public']['Tables']['monthly_statements']['Row'] & {
  owners?: {
    full_name: string;
    npwp_indonesia: string | null;
    country_of_residence: string;
    passport_number: string | null;
  } | null;
};

interface BuktiPotongPdfProps {
  statement: StatementRow;
}

export function BuktiPotongPdf({ statement }: BuktiPotongPdfProps) {
  const date = new Date(statement.billing_month);
  const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  
  // Tax period string, e.g. "08-2026"
  const taxPeriod = `${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>BUKTI PEMOTONGAN PPh PASAL 26</Text>
          <Text style={styles.subtitle}>(WITHHOLDING TAX SLIP ARTICLE 26)</Text>
          <Text style={{ marginTop: 10 }}>Masa Pajak / Tax Period: {taxPeriod}</Text>
        </View>

        {/* Pemotong Pajak (Tax Withholder) */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionHeader}>A. IDENTITAS PEMOTONG PAJAK / TAX WITHHOLDER IDENTITY</Text>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>1. NPWP / Tax ID</Text>
            <Text style={styles.cellValue}>00.000.000.0-000.000</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>2. Nama / Name</Text>
            <Text style={styles.cellValue}>PT Taksu Living Management</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.cellLabel}>3. Alamat / Address</Text>
            <Text style={styles.cellValue}>Jl. Penestanan Kelod, Ubud, Bali</Text>
          </View>
        </View>

        {/* Wajib Pajak (Taxpayer) */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionHeader}>B. IDENTITAS WAJIB PAJAK / TAXPAYER IDENTITY</Text>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>1. NPWP / Tax ID</Text>
            <Text style={styles.cellValue}>{statement.owners?.npwp_indonesia || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>2. NIK / Passport</Text>
            <Text style={styles.cellValue}>{statement.owners?.passport_number || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>3. Nama / Name</Text>
            <Text style={styles.cellValue}>{statement.owners?.full_name}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.cellLabel}>4. Negara Domisili / Country</Text>
            <Text style={styles.cellValue}>{statement.owners?.country_of_residence}</Text>
          </View>
        </View>

        {/* Objek Pajak (Tax Object) */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionHeader}>C. PPh PASAL 26 YANG DIPOTONG / PPh ARTICLE 26 WITHHELD</Text>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>1. Kode Objek Pajak / Tax Object Code</Text>
            <Text style={styles.cellValue}>27-100-01 (Sewa/Lease)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>2. Jumlah Penghasilan Bruto / Gross Income</Text>
            <Text style={styles.cellValue}>{formatCurrency(statement.owner_gross_payout_usd)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>3. Tarif / Rate</Text>
            <Text style={styles.cellValue}>{formatPercent(statement.pph26_rate)}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.cellLabel}>4. PPh Dipotong / Tax Withheld</Text>
            <Text style={styles.cellValue}>{formatCurrency(statement.pph26_amount_usd)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text>Ubud, Bali</Text>
            <Text>Pemotong Pajak / Tax Withholder</Text>
            <View style={styles.signatureLine}>
              <Text>PT Taksu Living Management</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
}
