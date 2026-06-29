import * as z from 'zod';

export const poolSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  villa_type: z.enum(['1br', '2br', '3br', '1br_l', '1br_xl', '2br_l', '2br_xl', '4br', 'mixed']),
  active: z.boolean().default(true),
  yield_formula: z.enum(['equal_share', 'revenue_weighted']).default('equal_share'),
});
