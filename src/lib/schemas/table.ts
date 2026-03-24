import { z } from 'zod';

export const tableSchema = z.object({
  tableNumber: z.number().int().positive('Table number must be positive.'),
  tableName: z.string().trim().min(2, 'Table name is required.').max(80),
  capacity: z.number().int().positive('Capacity must be positive.').max(30),
  isActive: z.boolean().default(true),
});

export type TableFormValues = z.output<typeof tableSchema>;
