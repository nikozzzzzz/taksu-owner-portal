import ExcelJS from 'exceljs';
import type { Database } from '@/lib/supabase/types';

type StatementRow = Database['public']['Tables']['monthly_statements']['Row'] & {
  villas?: {
    display_name: string;
    internal_code: string;
  } | null;
  owners?: {
    full_name: string;
    email: string;
  } | null;
};
type ExpenseRow = Database['public']['Tables']['operating_expenses']['Row'];
type BookingRow = Database['public']['Tables']['bookings']['Row'];

export async function generateStatementExcel(
  statement: StatementRow, 
  expenses: ExpenseRow[], 
  bookings: BookingRow[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const date = new Date(statement.billing_month);
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  workbook.creator = 'PT Taksu Living Management';
  workbook.lastModifiedBy = 'Taksu System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Item', key: 'item', width: 40 },
    { header: 'Amount (USD)', key: 'amount', width: 20 }
  ];

  summarySheet.addRows([
    ['Taksu Living Monthly Statement', ''],
    [`Period: ${monthName}`, ''],
    [`Property: ${statement.villas?.display_name || ''} (${statement.villas?.internal_code || ''})`, ''],
    [`Owner: ${statement.owners?.full_name || ''}`, ''],
    ['', ''],
    ['Gross Booking Revenue', statement.gross_revenue_usd],
    ['Channel Commissions', -statement.channel_commission_usd],
    ['PHR Tax (10%)', -statement.phr_tax_usd],
    ['Net Villa Revenue', statement.net_revenue_usd],
    ['', ''],
    ['Operating Expenses', -statement.total_opex_usd],
    ['Net Operating Profit', statement.net_profit_usd],
    ['', ''],
    [`Management Fee (${(statement.management_fee_rate * 100).toFixed(1)}%)`, -statement.management_fee_usd],
    ['Gross Owner Payout', statement.owner_gross_payout_usd],
    [`PPh 26 Withholding Tax (${(statement.pph26_rate * 100).toFixed(1)}%)`, -statement.pph26_amount_usd],
    ['', ''],
    ['NET OWNER PAYOUT', statement.owner_net_payout_usd],
  ]);

  // Style Summary
  summarySheet.getRow(1).font = { bold: true, size: 14 };
  summarySheet.getRow(9).font = { bold: true };
  summarySheet.getRow(12).font = { bold: true };
  summarySheet.getRow(15).font = { bold: true };
  summarySheet.getRow(18).font = { bold: true, size: 12 };
  summarySheet.getColumn('amount').numFmt = '"$"#,##0.00';

  // 2. Bookings Sheet
  const bookingsSheet = workbook.addWorksheet('Bookings');
  bookingsSheet.columns = [
    { header: 'Guest', key: 'guest', width: 20 },
    { header: 'Check In', key: 'in', width: 15 },
    { header: 'Check Out', key: 'out', width: 15 },
    { header: 'Nights', key: 'nights', width: 10 },
    { header: 'Channel', key: 'channel', width: 15 },
    { header: 'Gross Paid (USD)', key: 'gross', width: 15 },
    { header: 'Commission (USD)', key: 'comm', width: 15 },
    { header: 'PHR Tax (USD)', key: 'tax', width: 15 },
    { header: 'Net Revenue (USD)', key: 'net', width: 15 },
  ];
  
  bookingsSheet.getRow(1).font = { bold: true };
  
  bookings.forEach(b => {
    bookingsSheet.addRow({
      guest: b.guest_initials,
      in: b.check_in_date,
      out: b.check_out_date,
      nights: b.nights,
      channel: b.channel,
      gross: b.total_paid_by_guest_usd,
      comm: b.channel_commission_usd,
      tax: b.phr_tax_usd,
      net: b.net_to_villa_usd,
    });
  });

  ['gross', 'comm', 'tax', 'net'].forEach(key => {
    bookingsSheet.getColumn(key).numFmt = '"$"#,##0.00';
  });

  // 3. Expenses Sheet
  const expensesSheet = workbook.addWorksheet('Expenses');
  expensesSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Description', key: 'desc', width: 35 },
    { header: 'Vendor', key: 'vendor', width: 20 },
    { header: 'Amount (USD)', key: 'usd', width: 15 },
    { header: 'Amount (IDR)', key: 'idr', width: 15 },
  ];

  expensesSheet.getRow(1).font = { bold: true };

  expenses.forEach(e => {
    expensesSheet.addRow({
      date: e.expense_date,
      category: e.category.replace(/_/g, ' '),
      desc: e.description,
      vendor: e.vendor_name || '',
      usd: e.amount_usd,
      idr: e.amount_idr,
    });
  });

  expensesSheet.getColumn('usd').numFmt = '"$"#,##0.00';
  expensesSheet.getColumn('idr').numFmt = '"Rp"#,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}
