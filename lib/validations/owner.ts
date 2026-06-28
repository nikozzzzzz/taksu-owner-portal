import { z } from 'zod';

export const ownerProfileSchema = z.object({
  // Block 1: Personal Data
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  date_of_birth: z.string().optional().nullable(),
  citizenship: z.string().length(3, 'Citizenship must be a 3-letter ISO code').optional().nullable(),
  country_of_residence: z.string().min(2),
  tax_residency_country: z.string().min(2),
  passport_number: z.string().optional().nullable(),
  passport_issue_date: z.string().optional().nullable(),
  passport_expiry_date: z.string().optional().nullable(),
  passport_document_url: z.string().url().optional().nullable(),
  npwp_indonesia: z.string().optional().nullable(),
  npwp_document_url: z.string().url().optional().nullable(),
  tin_number: z.string().optional().nullable(),
  tin_document_url: z.string().url().optional().nullable(),
  registration_address: z.string().optional().nullable(),
  actual_address: z.string().optional().nullable(),
  email: z.string().email(),
  phone_whatsapp: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional().nullable(),
  phone_telegram: z.string().optional().nullable(),
  preferred_language: z.string().length(2).default('en'),

  // Block 2: Tax Profile
  dgt1_status: z.enum(['valid', 'expired', 'pending_review', 'none']).default('none'),
  pph26_effective_rate: z.union([z.literal(0.1), z.literal(0.2)]).default(0.2),
  dgt1_issue_date: z.string().optional().nullable(),
  dgt1_valid_until: z.string().optional().nullable(),
  dgt1_document_url: z.string().url().optional().nullable(),
  p3b_treaty_number: z.string().optional().nullable(),
  p3b_document_url: z.string().url().optional().nullable(),

  // Block 3: Bank Details
  bank_account_holder: z.string().optional().nullable(),
  bank_country: z.string().length(3).optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_account_swift: z.string().optional().nullable(),
  bank_account_iban: z.string().optional().nullable(),
  payout_currency: z.enum(['USD', 'EUR', 'AUD', 'GBP', 'SGD']).default('USD'),
  bank_address: z.string().optional().nullable(),
  intermediary_bank_details: z.any().optional().nullable(),
  alternative_payment_details: z.any().optional().nullable(),
  crypto_wallet_address: z.string().optional().nullable(),
  crypto_network: z.string().optional().nullable(),

  // Block 7: Notifications & Access
  statement_email: z.string().email().optional().nullable(),
  report_frequency: z.enum(['monthly', 'quarterly']).default('monthly'),
  statement_language: z.string().length(2).default('en'),
  booking_notifications_enabled: z.boolean().default(true),
  dgt1_notifications_enabled: z.boolean().default(true),
}).superRefine((data, ctx) => {
  // Database constraint mirrored here: passport dates
  if (data.passport_issue_date && data.passport_expiry_date) {
    if (new Date(data.passport_expiry_date) <= new Date(data.passport_issue_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passport expiry date must be after issue date',
        path: ['passport_expiry_date'],
      });
    }
  }

  // DGT-1 validation
  if (data.dgt1_status === 'valid') {
    if (!data.dgt1_issue_date || !data.dgt1_valid_until) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DGT-1 issue and expiry dates are required if status is valid',
        path: ['dgt1_valid_until'],
      });
    }
  }
});
