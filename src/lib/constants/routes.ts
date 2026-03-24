import type { StaffRole } from '../../types/domain';

export const adminNavigation: Array<{ to: string; label: string; roles?: StaffRole[] }> = [
  { to: '/admin/dashboard', label: 'Dashboard', roles: ['admin', 'cashier', 'kitchen', 'waiter'] },
  { to: '/admin/orders', label: 'Orders', roles: ['admin', 'cashier', 'kitchen', 'waiter'] },
  { to: '/admin/menu/categories', label: 'Categories', roles: ['admin'] },
  { to: '/admin/menu/items', label: 'Menu Items', roles: ['admin'] },
  { to: '/admin/tables', label: 'Tables', roles: ['admin'] },
  { to: '/admin/analytics', label: 'Analytics', roles: ['admin'] },
  { to: '/admin/settings', label: 'Settings', roles: ['admin'] },
  { to: '/admin/staff', label: 'Staff', roles: ['admin'] },
] as const;

export const kitchenNavigation = [{ to: '/kitchen/orders', label: 'Kitchen Board', roles: ['admin', 'cashier', 'kitchen', 'waiter'] }] as const;
