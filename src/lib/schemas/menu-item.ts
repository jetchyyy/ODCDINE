import { z } from 'zod';

export const menuItemSchema = z.object({
  categoryId: z.uuid('Select a category.'),
  name: z.string().trim().min(2, 'Item name is required.').max(120),
  description: z.string().trim().min(2, 'Description is required.').max(500),
  price: z.number().positive('Price must be greater than zero.'),
  preparationTimeMinutes: z.number().int().min(0).max(240),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  imageUrl: z.string().url().nullable().optional(),
});

export type MenuItemFormValues = z.output<typeof menuItemSchema>;
