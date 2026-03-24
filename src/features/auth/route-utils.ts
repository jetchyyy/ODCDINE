import type { StaffRole } from '../../types/domain';

export function getDefaultRouteForRole(role: StaffRole) {
  return role === 'kitchen' ? '/kitchen/orders' : '/admin/dashboard';
}
