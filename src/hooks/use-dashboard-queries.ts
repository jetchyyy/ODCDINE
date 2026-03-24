import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/constants/query-keys';
import {
  createCategory,
  createMenuItem,
  createPublicOrder,
  createStaffOrder,
  createStaff,
  createTable,
  fetchAnalytics,
  fetchBusinessSettings,
  fetchCategories,
  fetchMenuItems,
  fetchOrderById,
  fetchOrders,
  fetchPagedOrders,
  fetchPagedSales,
  fetchPublicOrder,
  fetchPublicTableContext,
  fetchStaff,
  fetchTables,
  toggleCategoryActive,
  toggleMenuItemAvailability,
  toggleTableActive,
  updateCategory,
  updateMenuItem,
  upsertOrderPayment,
  updateOrderStatus,
  updateStaffRole,
  updateTable,
  uploadBusinessLogo,
  uploadMenuItemImage,
  upsertBusinessSettings,
} from '../services/supabase/queries';
import type { CartLine } from '../store/cart-store';
import type {
  OpeningHours,
  OrderStatus,
  StaffRole,
} from '../types/domain';

export function useBusinessSettings() {
  return useQuery({
    queryKey: queryKeys.businessSettings,
    queryFn: fetchBusinessSettings,
  });
}

export function useCategories(options?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.categories, options?.activeOnly ? 'active' : 'all'],
    queryFn: () => fetchCategories(options),
  });
}

export function useMenuItems(options?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.menuItems, options?.activeOnly ? 'active' : 'all'],
    queryFn: () => fetchMenuItems(options),
  });
}

export function usePublicTableContext(tableCode?: string) {
  return useQuery({
    queryKey: queryKeys.publicTableContext(String(tableCode)),
    queryFn: () => fetchPublicTableContext(String(tableCode)),
    enabled: Boolean(tableCode),
  });
}

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: fetchOrders,
    refetchInterval: 3_000,
  });
}

export function usePagedOrders(options: {
  page: number;
  pageSize: number;
  status?: OrderStatus | 'all';
  tableId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.pagedOrders({
      page: options.page,
      pageSize: options.pageSize,
      status: options.status ?? 'all',
      tableId: options.tableId ?? 'all',
    }),
    queryFn: () => fetchPagedOrders(options),
    placeholderData: keepPreviousData,
    refetchInterval: 3_000,
  });
}

export function usePagedSales(options: {
  page: number;
  pageSize: number;
  tableId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.pagedSales({
      page: options.page,
      pageSize: options.pageSize,
      tableId: options.tableId ?? 'all',
    }),
    queryFn: () => fetchPagedSales(options),
    placeholderData: keepPreviousData,
    refetchInterval: 3_000,
  });
}

export function useOrder(orderId?: string) {
  return useQuery({
    queryKey: queryKeys.order(String(orderId)),
    queryFn: () => fetchOrderById(String(orderId)),
    enabled: Boolean(orderId),
  });
}

export function useTables(options?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.tables, options?.activeOnly ? 'active' : 'all'],
    queryFn: () => fetchTables(options),
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: fetchAnalytics,
    refetchInterval: 5_000,
  });
}

export function useStaff() {
  return useQuery({
    queryKey: queryKeys.staff,
    queryFn: fetchStaff,
  });
}

export function usePublicOrder(orderId?: string) {
  return useQuery({
    queryKey: queryKeys.publicOrder(String(orderId)),
    queryFn: () => fetchPublicOrder(String(orderId)),
    enabled: Boolean(orderId),
    refetchInterval: 15_000,
  });
}

export function useCreatePublicOrder() {
  return useMutation({
    mutationFn: ({ tableCode, items, notes }: { tableCode: string; items: CartLine[]; notes?: string }) =>
      createPublicOrder(tableCode, items, notes),
  });
}

export function useCreateStaffOrder() {
  return useMutation({
    mutationFn: ({ tableId, items, notes }: { tableId?: string | null; items: CartLine[]; notes?: string }) =>
      createStaffOrder({ tableId, items, notes }),
  });
}

export function useUploadMenuItemImage() {
  return useMutation({
    mutationFn: uploadMenuItemImage,
  });
}

export function useUploadBusinessLogo() {
  return useMutation({
    mutationFn: uploadBusinessLogo,
  });
}

export function useUpsertBusinessSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: {
      businessName: string;
      contactNumber: string;
      address: string;
      taxRate: number;
      serviceChargeRate: number;
      currency: string;
      queueResetAfter: number;
      logoUrl?: string | null;
      openingHours: OpeningHours;
    }) => upsertBusinessSettings(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.businessSettings });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, values }: { categoryId: string; values: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(categoryId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useToggleCategoryActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, isActive }: { categoryId: string; isActive: boolean }) =>
      toggleCategoryActive(categoryId, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMenuItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.menuItems });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ menuItemId, values }: { menuItemId: string; values: Parameters<typeof updateMenuItem>[1] }) =>
      updateMenuItem(menuItemId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.menuItems });
    },
  });
}

export function useToggleMenuItemAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ menuItemId, isAvailable }: { menuItemId: string; isAvailable: boolean }) =>
      toggleMenuItemAvailability(menuItemId, isAvailable),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.menuItems });
    },
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTable,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tables });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableId, values }: { tableId: string; values: Parameters<typeof updateTable>[1] }) =>
      updateTable(tableId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tables });
    },
  });
}

export function useToggleTableActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableId, isActive }: { tableId: string; isActive: boolean }) =>
      toggleTableActive(tableId, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tables });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(orderId, status),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      await queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
      await queryClient.invalidateQueries({ queryKey: queryKeys.order(variables.orderId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.publicOrder(variables.orderId) });
    },
  });
}

export function useUpsertOrderPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertOrderPayment,
    onSuccess: async (payment) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.order(payment.orderId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.publicOrder(payment.orderId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
    },
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: { email: string; password: string; fullName: string; role: StaffRole }) => createStaff(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.staff });
    },
  });
}

export function useUpdateStaffRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, role }: { staffId: string; role: StaffRole }) => updateStaffRole(staffId, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.staff });
    },
  });
}
