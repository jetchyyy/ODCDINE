import { z } from 'zod';

export const orderFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  tableId: z.string().optional(),
});

export type OrderFilterValues = z.infer<typeof orderFilterSchema>;
