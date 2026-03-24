export const queryKeys = {
  businessSettings: ['business-settings'] as const,
  categories: ['categories'] as const,
  menuItems: ['menu-items'] as const,
  publicTableContext: (tableCode: string) => ['public-table-context', tableCode] as const,
  tables: ['tables'] as const,
  orders: ['orders'] as const,
  order: (orderId: string) => ['order', orderId] as const,
  publicOrder: (orderId: string) => ['public-order', orderId] as const,
  analytics: ['analytics'] as const,
  staff: ['staff'] as const,
};
