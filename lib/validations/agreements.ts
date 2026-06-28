import { z } from 'zod';

export const agreementSchema = z.object({
  villa_id: z.string().uuid('Invalid villa ID'),
  owner_id: z.string().uuid('Invalid owner ID'),
  
  // Hak Sewa Details
  hak_sewa_number: z.string().optional().nullable(),
  hak_sewa_start_date: z.string().optional().nullable(),
  hak_sewa_end_date: z.string().optional().nullable(),
  hak_sewa_document_url: z.string().url('Invalid URL').optional().nullable(),
  hak_sewa_extension_terms: z.string().optional().nullable(),
  annual_rent_amount: z.number().min(0).optional().nullable(),

  // Management Agreement Details
  management_agreement_number: z.string().optional().nullable(),
  ma_signed_date: z.string().optional().nullable(),
  ma_document_url: z.string().url('Invalid URL').optional().nullable(),
  ma_term_months: z.number().int().min(1).optional().nullable(),
  pbb_tax_amount: z.number().min(0).optional().nullable(),

  status: z.enum(['active', 'expired', 'terminated']).default('active'),
}).superRefine((data, ctx) => {
  if (data.hak_sewa_start_date && data.hak_sewa_end_date) {
    if (new Date(data.hak_sewa_end_date) <= new Date(data.hak_sewa_start_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hak Sewa end date must be after start date',
        path: ['hak_sewa_end_date'],
      });
    }
  }
});
