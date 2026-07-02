import { z } from 'zod';

// ─── Categories ───────────────────────────────────────────────────────────────
export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['income', 'expense']),
  description: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#6B7280'),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  entity_type: z.enum(['villa', 'management_company']),
  villa_id: z.string().uuid().optional().nullable(),
  transaction_type: z.enum(['income', 'expense']),
  category_id: z.string().uuid('Category is required'),
  title: z.string().min(1, 'Title is required').max(255),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['USD', 'IDR', 'EUR']).default('USD'),
  amount_usd: z.number().optional().nullable(),
  fx_rate: z.number().positive().default(1.0),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  period_month: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  vendor_name: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  responsible_owner_id: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'confirmed', 'cancelled']).default('confirmed'),
  attachment_urls: z.array(z.string()).default([]),
  invoice_id: z.string().uuid().optional().nullable(),
}).refine((data) => {
  if (data.entity_type === 'villa' && !data.villa_id) {
    return false;
  }
  return true;
}, { message: 'Villa is required when entity type is villa', path: ['villa_id'] });

export type TransactionInput = z.infer<typeof transactionSchema>;

// ─── Invoice Items ────────────────────────────────────────────────────────────
export const invoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive').default(1),
  unit_price_usd: z.number().min(0, 'Price must be non-negative'),
  sort_order: z.number().int().default(0),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoiceSchema = z.object({
  id: z.string().uuid().optional(),
  invoice_number: z.string().min(1, 'Invoice number is required').max(50),
  issuer_name: z.string().default('PT Taksu Living Management'),
  client_name: z.string().min(1, 'Client name is required'),
  client_address: z.string().optional().nullable(),
  client_tax_id: z.string().optional().nullable(),
  client_email: z.string().email().optional().nullable().or(z.literal('')),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  currency: z.enum(['USD', 'IDR', 'EUR']).default('USD'),
  tax_rate: z.number().min(0).max(1).default(0),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  entity_type: z.enum(['villa', 'management_company']),
  villa_id: z.string().uuid().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;

// ─── Filter Params ────────────────────────────────────────────────────────────
export const transactionFilterSchema = z.object({
  entity_type: z.enum(['villa', 'management_company']).optional(),
  villa_id: z.string().uuid().optional(),
  transaction_type: z.enum(['income', 'expense']).optional(),
  category_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'confirmed', 'cancelled']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
});

export type TransactionFilter = z.infer<typeof transactionFilterSchema>;
