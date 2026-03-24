import type { BusinessSettings } from '../../types/domain';
import { defaultOpeningHours } from '../utils/opening-hours';

export const defaultBusinessSettings: BusinessSettings = {
  id: 'default-business-settings',
  businessName: 'Harbor Brew House',
  logoUrl: null,
  contactNumber: '+63 917 555 0188',
  address: '28 Bayfront Ave, Makati City',
  taxRate: 0.12,
  serviceChargeRate: 0.1,
  currency: 'PHP',
  queueResetAfter: 50,
  openingHours: defaultOpeningHours,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};
