export const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export type Weekday = (typeof weekdays)[number];
export type StaffRole = 'admin' | 'cashier' | 'kitchen' | 'waiter';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_to_serve'
  | 'served'
  | 'completed'
  | 'cancelled';
export type TableSessionStatus = 'open' | 'closed';
export type PaymentMethod = 'cash' | 'card' | 'gcash' | 'maya' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OpeningHours {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

export interface BusinessSettings {
  id: string;
  businessName: string;
  logoUrl?: string | null;
  contactNumber: string;
  address: string;
  taxRate: number;
  serviceChargeRate: number;
  currency: string;
  queueResetAfter: number;
  openingHours: OpeningHours;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantTable {
  id: string;
  tableNumber: number;
  tableName: string;
  tableCode: string;
  qrCodeUrl?: string | null;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TableSession {
  id: string;
  tableId: string;
  sessionCode: string;
  status: TableSessionStatus;
  openedAt: string;
  closedAt?: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId?: string | null;
  itemName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  notes?: string | null;
  createdAt: string;
}

export interface OrderStatusLog {
  id: string;
  orderId: string;
  status: OrderStatus;
  changedBy?: string | null;
  changedByName?: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  referenceNumber?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  tableId?: string | null;
  tableCode?: string | null;
  tableName: string;
  tableNumber?: number;
  orderNumber: string;
  queueNumber?: string | null;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  total: number;
  notes?: string | null;
  source: 'qr' | 'staff';
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusLogs: OrderStatusLog[];
  payment?: Payment | null;
}

export interface StaffProfile {
  id: string;
  email?: string | null;
  fullName: string;
  role: StaffRole;
  createdAt?: string;
}

export interface PublicOrderResult {
  orderId: string;
  orderNumber: string;
}

export interface PublicTableContext {
  business: BusinessSettings | null;
  table: RestaurantTable;
  categories: Category[];
  menuItems: MenuItem[];
}

export interface AnalyticsPoint {
  label: string;
  sales: number;
  orders: number;
}

export interface TopSellingItem {
  name: string;
  quantity: number;
  sales: number;
}

export interface AnalyticsSummary {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  totalOrders: number;
  todayOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  hourlyVolume: AnalyticsPoint[];
  salesTrend: AnalyticsPoint[];
  topItems: TopSellingItem[];
}
