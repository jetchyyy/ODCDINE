import type { OrderStatus, StaffRole } from '../../types/domain';

export const STAFF_ROLES: StaffRole[] = ['admin', 'cashier', 'kitchen', 'waiter'];
export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready_to_serve',
  'served',
  'completed',
  'cancelled',
];
export const ACTIVE_KITCHEN_STATUSES: OrderStatus[] = ['confirmed', 'preparing', 'ready_to_serve'];
export const ADMIN_ONLY_ROLES: StaffRole[] = ['admin'];
export const ORDER_MANAGEMENT_ROLES: StaffRole[] = ['admin', 'cashier', 'kitchen', 'waiter'];
export const STAFF_PORTAL_ROLES: StaffRole[] = ['admin', 'cashier', 'kitchen', 'waiter'];
export const MENU_IMAGE_BUCKET = 'menu-images';
export const BRANDING_BUCKET = 'branding';
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
