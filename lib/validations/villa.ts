import { z } from 'zod';

export const villaSchema = z.object({
  // Block 4: Physical Parameters & Identification
  internal_code: z.string().min(1, 'Internal code is required'),
  display_name: z.string().min(1, 'Display name is required'),
  villa_type: z.enum(['studio', '1br', '2br', '3br', '1br_l', '1br_xl', '2br_l', '2br_xl', '4br']),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  max_guests: z.number().int().min(1),
  has_private_pool: z.boolean(),
  view_type: z.string().optional().nullable(),
  square_meters: z.number().min(0).optional().nullable(),
  land_area_sqm: z.number().min(0).optional().nullable(),
  build_year: z.number().int().min(1900).max(new Date().getFullYear() + 5).optional().nullable(),
  physical_address: z.string().optional().nullable(),
  google_maps_url: z.string().url().optional().nullable(),
  photo_urls: z.array(z.string().url()).default([]),
  amenities: z.array(z.string()).default([]),
  smart_lock_id: z.string().optional().nullable(),

  // Legal Documents (PBG/SLF)
  cadastral_number: z.string().optional().nullable(),
  pbg_number: z.string().optional().nullable(),
  pbg_document_url: z.string().url().optional().nullable(),
  slf_number: z.string().optional().nullable(),
  slf_status: z.enum(['received', 'in_progress', 'not_submitted']).default('not_submitted'),
  slf_issue_date: z.string().optional().nullable(),
  slf_expiry_date: z.string().optional().nullable(),
  slf_document_url: z.string().url().optional().nullable(),

  // Utilities
  pln_id: z.string().optional().nullable(),
  pln_tariff: z.string().optional().nullable(),
  pdam_id: z.string().optional().nullable(),
  water_source: z.string().optional().nullable(),

  // PMS / Integrations
  pricelabs_id: z.string().optional().nullable(),
  turno_id: z.string().optional().nullable(),
  airbnb_id: z.string().optional().nullable(),
  booking_com_id: z.string().optional().nullable(),
  hostaway_listing_id: z.number().int().optional().nullable(),
  wifi_network: z.string().optional().nullable(),
  wifi_password: z.string().optional().nullable(),

  // Ownership & Links
  phase: z.number().int().default(1),
  ownership_type: z.enum(['investor_owned', 'pt_owned']).default('investor_owned'),
  owner_id: z.string().uuid().optional().nullable(),
  pool_id: z.string().uuid().optional().nullable(),

  // Block 6: Financials
  base_price_usd: z.number().min(0).optional().nullable(),
  premium_multiplier: z.number().min(0).default(1),
  estimated_market_value_usd: z.number().min(0).optional().nullable(),
  estimated_capex_usd: z.number().min(0).optional().nullable(),
  default_management_fee_rate: z.number().min(0).max(100).default(20),
  min_payout_threshold_usd: z.number().min(0).default(0),
  owner_nights_limit_per_year: z.number().int().min(0).default(21),
  start_float_usd: z.number().min(0).default(0),
  payout_type: z.enum(['net_profit_share', 'gross']).default('net_profit_share'),

  status: z.enum(['pre_launch', 'active', 'maintenance', 'paused', 'closed']).default('pre_launch'),
}).superRefine((data, ctx) => {
  // SLF Dates validation
  if (data.slf_issue_date && data.slf_expiry_date) {
    if (new Date(data.slf_expiry_date) <= new Date(data.slf_issue_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SLF expiry date must be after issue date',
        path: ['slf_expiry_date'],
      });
    }
  }

  // SLF Status validation
  if (data.slf_status === 'received') {
    if (!data.slf_issue_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SLF issue date is required when SLF is received',
        path: ['slf_issue_date'],
      });
    }
  }
});
