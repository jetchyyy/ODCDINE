import { z } from 'zod';
import { weekdays } from '../../types/domain';

export const settingsSchema = z.object({
  businessName: z.string().trim().min(2, 'Business name is required.').max(120),
  contactNumber: z.string().trim().min(7, 'Contact number is required.').max(30),
  address: z.string().trim().min(5, 'Address is required.').max(240),
  taxRate: z.number().min(0).max(1),
  serviceChargeRate: z.number().min(0).max(1),
  currency: z.string().trim().min(3).max(3),
  queueResetAfter: z.number().int().min(1).max(9999),
  logoUrl: z.string().url().nullable().optional(),
  openingHours: z.object(
    Object.fromEntries(weekdays.map((day) => [day, z.string().trim().min(3).max(30)])) as Record<
      (typeof weekdays)[number],
      z.ZodString
    >,
  ),
});

export type SettingsFormValues = z.output<typeof settingsSchema>;
