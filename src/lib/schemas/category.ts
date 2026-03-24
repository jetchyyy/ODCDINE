import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required.').max(80),
  description: z.string().trim().min(2, 'Description is required.').max(240),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean().default(true),
});

export type CategoryFormValues = z.output<typeof categorySchema>;
