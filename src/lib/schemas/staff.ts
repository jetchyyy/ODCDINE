import { z } from 'zod';
import { STAFF_ROLES } from '../constants/app';

export const createStaffSchema = z.object({
  email: z.email('Enter a valid staff email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  fullName: z.string().trim().min(2, 'Full name is required.').max(120),
  role: z.enum(STAFF_ROLES),
});

export const updateStaffRoleSchema = z.object({
  role: z.enum(STAFF_ROLES),
});

export type CreateStaffValues = z.output<typeof createStaffSchema>;
export type UpdateStaffRoleValues = z.output<typeof updateStaffRoleSchema>;
