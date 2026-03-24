export const queryKeys = {
  businessSettings: ['business-settings'] as const,
  categories: ['categories'] as const,
  menuItems: ['menu-items'] as const,
  publicTableContext: (tableCode: string) => ['public-table-context', tableCode] as const,
  tables: ['tables'] as const,
  orders: ['orders'] as const,
  pagedOrders: (params: { page: number; pageSize: number; status: string; tableId: string }) =>
    ['orders', 'paged', params.page, params.pageSize, params.status, params.tableId] as const,
  pagedSales: (params: { page: number; pageSize: number; tableId: string }) =>
    ['sales', 'paged', params.page, params.pageSize, params.tableId] as const,
  order: (orderId: string) => ['order', orderId] as const,
  publicOrder: (orderId: string) => ['public-order', orderId] as const,
  analytics: ['analytics'] as const,
  staff: ['staff'] as const,
};
