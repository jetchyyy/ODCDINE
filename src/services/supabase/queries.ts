import { endOfMonth, endOfToday, format, isSameDay, parseISO, startOfMonth, startOfToday, startOfWeek, subDays } from 'date-fns';
import { supabase } from '../../lib/supabase/client';
import { BRANDING_BUCKET, MENU_IMAGE_BUCKET } from '../../lib/constants/app';
import { defaultOpeningHours, normalizeOpeningHours } from '../../lib/utils/opening-hours';
import { buildBrandingImagePath, buildMenuItemImagePath, getPublicBucketLabel, validateImageFile } from '../../lib/utils/storage';
import type {
  AnalyticsPoint,
  AnalyticsSummary,
  BusinessSettings,
  Category,
  MenuItem,
  OpeningHours,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusLog,
  Payment,
  PublicOrderResult,
  PublicTableContext,
  RestaurantTable,
  StaffProfile,
} from '../../types/domain';
import type { CartLine } from '../../store/cart-store';

type SupabaseRow = Record<string, unknown>;

export interface PagedOrdersResult {
  orders: Order[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StaffOrderResult {
  orderId: string;
  orderNumber: string;
  queueNumber?: string | null;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase environment variables are missing.');
  }

  return supabase;
}

function isPermissionError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const message = error.message?.toLowerCase() ?? '';
  return (
    error.code === '42501' ||
    message.includes('permission denied') ||
    message.includes('row-level security') ||
    message.includes('not authenticated') ||
    message.includes('jwt')
  );
}

function maybeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function mapBusinessSettings(row: SupabaseRow): BusinessSettings {
  return {
    id: String(row.id),
    businessName: String(row.business_name ?? ''),
    logoUrl: (row.logo_url as string | null | undefined) ?? null,
    contactNumber: String(row.contact_number ?? ''),
    address: String(row.address ?? ''),
    taxRate: Number(row.tax_rate ?? 0),
    serviceChargeRate: Number(row.service_charge_rate ?? 0),
    currency: String(row.currency ?? 'PHP'),
    queueResetAfter: Number(row.queue_reset_after ?? 50),
    openingHours: normalizeOpeningHours(row.opening_hours),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapCategory(row: SupabaseRow): Category {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapMenuItem(row: SupabaseRow): MenuItem {
  const category = row.categories as SupabaseRow | null | undefined;

  return {
    id: String(row.id),
    categoryId: String(row.category_id),
    categoryName: category ? String(category.name ?? '') : undefined,
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    price: Number(row.price ?? 0),
    imageUrl: (row.image_url as string | null | undefined) ?? null,
    isAvailable: Boolean(row.is_available),
    isFeatured: Boolean(row.is_featured),
    preparationTimeMinutes: Number(row.preparation_time_minutes ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapTable(row: SupabaseRow): RestaurantTable {
  return {
    id: String(row.id),
    tableNumber: Number(row.table_number ?? 0),
    tableName: String(row.table_name ?? ''),
    tableCode: String(row.table_code ?? ''),
    qrCodeUrl: (row.qr_code_url as string | null | undefined) ?? null,
    capacity: Number(row.capacity ?? 0),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapOrderItem(row: SupabaseRow): OrderItem {
  return {
    id: String(row.id),
    orderId: String(row.order_id ?? ''),
    menuItemId: (row.menu_item_id as string | null | undefined) ?? null,
    itemName: String(row.item_name ?? ''),
    unitPrice: Number(row.unit_price ?? 0),
    quantity: Number(row.quantity ?? 0),
    lineTotal: Number(row.line_total ?? 0),
    notes: (row.notes as string | null | undefined) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapOrderStatusLog(row: SupabaseRow): OrderStatusLog {
  const profile = row.profiles as SupabaseRow | null | undefined;

  return {
    id: String(row.id),
    orderId: String(row.order_id ?? ''),
    status: row.status as OrderStatus,
    changedBy: (row.changed_by as string | null | undefined) ?? null,
    changedByName: profile ? String(profile.full_name ?? '') : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapOrder(row: SupabaseRow): Order {
  const table = row.tables as SupabaseRow | null | undefined;
  const paymentRow = row.payments as SupabaseRow | null | undefined;
  const payment: Payment | null = paymentRow
    ? {
        id: String(paymentRow.id),
        orderId: String(paymentRow.order_id ?? ''),
        paymentMethod: paymentRow.payment_method as Payment['paymentMethod'],
        amountPaid: Number(paymentRow.amount_paid ?? 0),
        paymentStatus: paymentRow.payment_status as Payment['paymentStatus'],
        referenceNumber: (paymentRow.reference_number as string | null | undefined) ?? null,
        createdAt: String(paymentRow.created_at ?? new Date().toISOString()),
      }
    : null;

  return {
    id: String(row.id),
    tableId: (row.table_id as string | null | undefined) ?? null,
    tableCode: (table?.table_code as string | null | undefined) ?? null,
    tableName: String(table?.table_name ?? (row.source === 'staff' ? 'Walk-in / No table' : 'Unknown Table')),
    tableNumber: table?.table_number ? Number(table.table_number) : undefined,
    orderNumber: String(row.order_number ?? ''),
    queueNumber: (row.queue_number as string | null | undefined) ?? null,
    status: row.status as OrderStatus,
    subtotal: Number(row.subtotal ?? 0),
    taxAmount: Number(row.tax_amount ?? 0),
    serviceChargeAmount: Number(row.service_charge_amount ?? 0),
    total: Number(row.total ?? 0),
    notes: (row.notes as string | null | undefined) ?? null,
    source: (row.source as Order['source'] | undefined) ?? 'qr',
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    items: maybeArray(row.order_items).map((item) => mapOrderItem(item as SupabaseRow)),
    statusLogs: maybeArray(row.order_status_logs).map((log) => mapOrderStatusLog(log as SupabaseRow)),
    payment,
  };
}

function mapStaff(row: SupabaseRow): StaffProfile {
  return {
    id: String(row.id),
    email: (row.email as string | null | undefined) ?? null,
    fullName: String(row.full_name ?? ''),
    role: row.role as StaffProfile['role'],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function emptyAnalytics(): AnalyticsSummary {
  return {
    todaySales: 0,
    weeklySales: 0,
    monthlySales: 0,
    totalOrders: 0,
    todayOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0,
    hourlyVolume: [],
    salesTrend: [],
    topItems: [],
  };
}

function buildAnalytics(orders: Order[]): AnalyticsSummary {
  if (orders.length === 0) {
    return emptyAnalytics();
  }

  const now = new Date();
  const todayOrders = orders.filter((order) => isSameDay(parseISO(order.createdAt), now));
  const weeklyStart = startOfWeek(now, { weekStartsOn: 1 });
  const weeklyOrders = orders.filter((order) => parseISO(order.createdAt) >= weeklyStart);
  const monthlyStart = startOfMonth(now);
  const monthlyEnd = endOfMonth(now);
  const monthlyOrders = orders.filter((order) => {
    const date = parseISO(order.createdAt);
    return date >= monthlyStart && date <= monthlyEnd;
  });
  const completedOrders = orders.filter((order) => order.status === 'completed');
  const cancelledOrders = orders.filter((order) => order.status === 'cancelled');

  const hourlyMap = new Map<string, AnalyticsPoint>();
  for (let hour = 0; hour < 24; hour += 1) {
    const label = `${String(hour).padStart(2, '0')}:00`;
    hourlyMap.set(label, { label, sales: 0, orders: 0 });
  }

  for (const order of todayOrders) {
    const label = format(parseISO(order.createdAt), 'HH:00');
    const current = hourlyMap.get(label);
    if (current) {
      current.sales += order.total;
      current.orders += 1;
    }
  }

  const salesTrend: AnalyticsPoint[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = subDays(now, offset);
    const dayOrders = orders.filter((order) => isSameDay(parseISO(order.createdAt), date));
    salesTrend.push({
      label: format(date, 'EEE'),
      sales: dayOrders.reduce((sum, order) => sum + order.total, 0),
      orders: dayOrders.length,
    });
  }

  const topItemsMap = new Map<string, { quantity: number; sales: number }>();
  for (const order of completedOrders) {
    for (const item of order.items) {
      const existing = topItemsMap.get(item.itemName) ?? { quantity: 0, sales: 0 };
      existing.quantity += item.quantity;
      existing.sales += item.lineTotal;
      topItemsMap.set(item.itemName, existing);
    }
  }

  return {
    todaySales: todayOrders.reduce((sum, order) => sum + order.total, 0),
    weeklySales: weeklyOrders.reduce((sum, order) => sum + order.total, 0),
    monthlySales: monthlyOrders.reduce((sum, order) => sum + order.total, 0),
    totalOrders: orders.length,
    todayOrders: todayOrders.length,
    completedOrders: completedOrders.length,
    cancelledOrders: cancelledOrders.length,
    averageOrderValue: orders.reduce((sum, order) => sum + order.total, 0) / orders.length,
    hourlyVolume: [...hourlyMap.values()],
    salesTrend,
    topItems: [...topItemsMap.entries()]
      .map(([name, value]) => ({ name, quantity: value.quantity, sales: value.sales }))
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5),
  };
}

async function uploadPublicAsset(bucket: string, path: string, file: File) {
  const client = requireSupabase();
  validateImageFile(file);

  const { error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    throw new Error(`Unable to upload ${getPublicBucketLabel(bucket)}: ${error.message}`);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadMenuItemImage(file: File) {
  return uploadPublicAsset(MENU_IMAGE_BUCKET, buildMenuItemImagePath(file), file);
}

export async function uploadBusinessLogo(file: File) {
  return uploadPublicAsset(BRANDING_BUCKET, buildBrandingImagePath(file), file);
}

export async function fetchBusinessSettings() {
  const client = requireSupabase();
  const { data, error } = await client.from('business_settings').select('*').limit(1).maybeSingle();

  if (error) {
    if (isPermissionError(error)) {
      return null;
    }
    throw error;
  }

  return data ? mapBusinessSettings(data as SupabaseRow) : null;
}

export async function fetchCategories(options?: { activeOnly?: boolean }) {
  const client = requireSupabase();
  let query = client.from('categories').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true });

  if (options?.activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapCategory(row as SupabaseRow));
}

export async function fetchMenuItems(options?: { activeOnly?: boolean }) {
  const client = requireSupabase();
  let query = client
    .from('menu_items')
    .select('*, categories(name)')
    .order('created_at', { ascending: false });

  if (options?.activeOnly) {
    query = query.eq('is_available', true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapMenuItem(row as SupabaseRow));
}

export async function fetchTables(options?: { activeOnly?: boolean }) {
  const client = requireSupabase();
  let query = client.from('tables').select('*').order('table_number', { ascending: true });

  if (options?.activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapTable(row as SupabaseRow));
}

export async function fetchOrders() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('orders')
    .select('*, tables(table_name, table_number), order_items(*), order_status_logs(*, profiles(full_name)), payments(*)')
    .order('created_at', { ascending: false });

  if (error) {
    if (isPermissionError(error)) {
      return [];
    }
    throw error;
  }

  return (data ?? []).map((row) => mapOrder(row as SupabaseRow));
}

export async function fetchPagedOrders(input: {
  page: number;
  pageSize: number;
  status?: OrderStatus | 'all';
  tableId?: string;
}): Promise<PagedOrdersResult> {
  const client = requireSupabase();
  const safePage = Math.max(1, input.page);
  const safePageSize = Math.max(1, input.pageSize);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = client
    .from('orders')
    .select('*, tables(table_name, table_number), order_items(*), order_status_logs(*, profiles(full_name)), payments(*)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (input.status && input.status !== 'all') {
    query = query.eq('status', input.status);
  }

  if (input.tableId && input.tableId !== 'all') {
    query = query.eq('table_id', input.tableId);
  }

  const { data, error, count } = await query;

  if (error) {
    if (isPermissionError(error)) {
      return {
        orders: [],
        totalCount: 0,
        page: safePage,
        pageSize: safePageSize,
        totalPages: 0,
      };
    }
    throw error;
  }

  const totalCount = count ?? 0;
  return {
    orders: (data ?? []).map((row) => mapOrder(row as SupabaseRow)),
    totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: totalCount > 0 ? Math.ceil(totalCount / safePageSize) : 0,
  };
}

export async function fetchPagedSales(input: {
  page: number;
  pageSize: number;
  tableId?: string;
}): Promise<PagedOrdersResult> {
  const client = requireSupabase();
  const safePage = Math.max(1, input.page);
  const safePageSize = Math.max(1, input.pageSize);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = client
    .from('orders')
    .select('*, tables(table_name, table_number), order_items(*), payments!inner(*)', {
      count: 'exact',
    })
    .eq('payments.payment_status', 'paid')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (input.tableId && input.tableId !== 'all') {
    query = query.eq('table_id', input.tableId);
  }

  const { data, error, count } = await query;

  if (error) {
    if (isPermissionError(error)) {
      return {
        orders: [],
        totalCount: 0,
        page: safePage,
        pageSize: safePageSize,
        totalPages: 0,
      };
    }
    throw error;
  }

  const totalCount = count ?? 0;
  return {
    orders: (data ?? []).map((row) => mapOrder(row as SupabaseRow)),
    totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: totalCount > 0 ? Math.ceil(totalCount / safePageSize) : 0,
  };
}

export async function fetchOrderById(orderId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('orders')
    .select('*, tables(table_name, table_number, table_code), order_items(*), order_status_logs(*, profiles(full_name)), payments(*)')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    if (isPermissionError(error)) {
      return null;
    }
    throw error;
  }

  return data ? mapOrder(data as SupabaseRow) : null;
}

export async function fetchAnalytics() {
  return buildAnalytics(await fetchOrders());
}

export async function fetchStaff() {
  const client = requireSupabase();
  const { data, error } = await client.from('profiles').select('*').order('created_at', { ascending: true });

  if (error) {
    if (isPermissionError(error)) {
      return [];
    }
    throw error;
  }

  return (data ?? []).map((row) => mapStaff(row as SupabaseRow));
}

export async function fetchPublicOrder(orderId: string) {
  const client = requireSupabase();
  const { data, error } = await client.rpc('get_public_order', { p_order_id: orderId });

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapOrder(data as SupabaseRow);
}

export async function fetchPublicTableContext(tableCode: string): Promise<PublicTableContext | null> {
  const client = requireSupabase();
  const { data: tableRow, error: tableError } = await client
    .from('tables')
    .select('*')
    .eq('table_code', tableCode)
    .eq('is_active', true)
    .maybeSingle();

  if (tableError) {
    throw tableError;
  }

  if (!tableRow) {
    return null;
  }

  const [business, categories, menuItems] = await Promise.all([
    fetchBusinessSettings(),
    fetchCategories({ activeOnly: true }),
    fetchMenuItems({ activeOnly: true }),
  ]);

  return {
    business,
    table: mapTable(tableRow as SupabaseRow),
    categories,
    menuItems,
  };
}

export async function createPublicOrder(tableCode: string, items: CartLine[], notes?: string): Promise<PublicOrderResult> {
  const client = requireSupabase();
  const payload = items.map((item) => ({
    menu_item_id: item.menuItem.id,
    quantity: item.quantity,
    notes: item.notes ?? null,
  }));

  const { data, error } = await client.rpc('create_public_order', {
    p_table_code: tableCode,
    p_items: payload,
    p_notes: notes ?? null,
  });

  if (error) {
    throw error;
  }

  const result = Array.isArray(data) ? data[0] : data;
  return {
    orderId: String(result.order_id),
    orderNumber: String(result.order_number),
  };
}

export async function createStaffOrder(input: {
  tableId?: string | null;
  items: CartLine[];
  notes?: string;
}): Promise<StaffOrderResult> {
  const client = requireSupabase();
  const payload = input.items.map((item) => ({
    menu_item_id: item.menuItem.id,
    quantity: item.quantity,
    notes: item.notes ?? null,
  }));

  const { data, error } = await client.rpc('create_staff_order', {
    p_table_id: input.tableId ?? null,
    p_items: payload,
    p_notes: input.notes ?? null,
  });

  if (error) {
    throw error;
  }

  const result = Array.isArray(data) ? data[0] : data;
  return {
    orderId: String(result.order_id),
    orderNumber: String(result.order_number),
    queueNumber: (result.queue_number as string | null | undefined) ?? null,
  };
}

export async function upsertBusinessSettings(input: {
  businessName: string;
  contactNumber: string;
  address: string;
  taxRate: number;
  serviceChargeRate: number;
  currency: string;
  queueResetAfter: number;
  logoUrl?: string | null;
  openingHours: OpeningHours;
}) {
  const client = requireSupabase();
  const { data: existing, error: fetchError } = await client.from('business_settings').select('id').limit(1).maybeSingle();

  if (fetchError && !isPermissionError(fetchError)) {
    throw fetchError;
  }

  const payload = {
    business_name: input.businessName,
    contact_number: input.contactNumber,
    address: input.address,
    tax_rate: input.taxRate,
    service_charge_rate: input.serviceChargeRate,
    currency: input.currency.toUpperCase(),
    queue_reset_after: input.queueResetAfter,
    logo_url: input.logoUrl ?? null,
    opening_hours: input.openingHours ?? defaultOpeningHours,
  };

  const query = existing?.id
    ? client.from('business_settings').update(payload).eq('id', existing.id).select().single()
    : client.from('business_settings').insert(payload).select().single();

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return mapBusinessSettings(data as SupabaseRow);
}

export async function createCategory(input: { name: string; description: string; sortOrder: number; isActive: boolean }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('categories')
    .insert({
      name: input.name,
      description: input.description,
      sort_order: input.sortOrder,
      is_active: input.isActive,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapCategory(data as SupabaseRow);
}

export async function updateCategory(categoryId: string, input: { name: string; description: string; sortOrder: number; isActive: boolean }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('categories')
    .update({
      name: input.name,
      description: input.description,
      sort_order: input.sortOrder,
      is_active: input.isActive,
    })
    .eq('id', categoryId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapCategory(data as SupabaseRow);
}

export async function toggleCategoryActive(categoryId: string, isActive: boolean) {
  return updateCategory(categoryId, {
    ...(await fetchCategoryById(categoryId)),
    isActive,
  });
}

async function fetchCategoryById(categoryId: string) {
  const client = requireSupabase();
  const { data, error } = await client.from('categories').select('*').eq('id', categoryId).single();
  if (error) {
    throw error;
  }

  const category = mapCategory(data as SupabaseRow);
  return {
    name: category.name,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  };
}

export async function createMenuItem(input: {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  preparationTimeMinutes: number;
  isFeatured: boolean;
  isAvailable: boolean;
}) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('menu_items')
    .insert({
      category_id: input.categoryId,
      name: input.name,
      description: input.description,
      price: input.price,
      image_url: input.imageUrl ?? null,
      preparation_time_minutes: input.preparationTimeMinutes,
      is_featured: input.isFeatured,
      is_available: input.isAvailable,
    })
    .select('*, categories(name)')
    .single();

  if (error) {
    throw error;
  }

  return mapMenuItem(data as SupabaseRow);
}

export async function updateMenuItem(
  menuItemId: string,
  input: {
    categoryId: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string | null;
    preparationTimeMinutes: number;
    isFeatured: boolean;
    isAvailable: boolean;
  },
) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('menu_items')
    .update({
      category_id: input.categoryId,
      name: input.name,
      description: input.description,
      price: input.price,
      image_url: input.imageUrl ?? null,
      preparation_time_minutes: input.preparationTimeMinutes,
      is_featured: input.isFeatured,
      is_available: input.isAvailable,
    })
    .eq('id', menuItemId)
    .select('*, categories(name)')
    .single();

  if (error) {
    throw error;
  }

  return mapMenuItem(data as SupabaseRow);
}

export async function toggleMenuItemAvailability(menuItemId: string, isAvailable: boolean) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', menuItemId)
    .select('*, categories(name)')
    .single();

  if (error) {
    throw error;
  }

  return mapMenuItem(data as SupabaseRow);
}

export async function createTable(input: { tableNumber: number; tableName: string; capacity: number; isActive: boolean }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('tables')
    .insert({
      table_number: input.tableNumber,
      table_name: input.tableName,
      capacity: input.capacity,
      is_active: input.isActive,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapTable(data as SupabaseRow);
}

export async function updateTable(tableId: string, input: { tableNumber: number; tableName: string; capacity: number; isActive: boolean }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('tables')
    .update({
      table_number: input.tableNumber,
      table_name: input.tableName,
      capacity: input.capacity,
      is_active: input.isActive,
    })
    .eq('id', tableId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapTable(data as SupabaseRow);
}

export async function toggleTableActive(tableId: string, isActive: boolean) {
  const client = requireSupabase();
  const { data, error } = await client.from('tables').update({ is_active: isActive }).eq('id', tableId).select().single();

  if (error) {
    throw error;
  }

  return mapTable(data as SupabaseRow);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const client = requireSupabase();
  const { error } = await client.rpc('staff_update_order_status', {
    p_order_id: orderId,
    p_status: status,
  });

  if (error) {
    throw error;
  }
}

export async function upsertOrderPayment(input: {
  orderId: string;
  paymentMethod: 'cash' | 'gcash';
  paymentStatus: 'pending' | 'paid';
  amountPaid: number;
  referenceNumber?: string | null;
}) {
  const client = requireSupabase();
  const payload = {
    order_id: input.orderId,
    payment_method: input.paymentMethod,
    payment_status: input.paymentStatus,
    amount_paid: input.amountPaid,
    reference_number: input.paymentMethod === 'gcash' ? input.referenceNumber ?? null : null,
  };

  const { data, error } = await client
    .from('payments')
    .upsert(payload, { onConflict: 'order_id' })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return {
    id: String(data.id),
    orderId: String(data.order_id ?? ''),
    paymentMethod: data.payment_method as Payment['paymentMethod'],
    amountPaid: Number(data.amount_paid ?? 0),
    paymentStatus: data.payment_status as Payment['paymentStatus'],
    referenceNumber: (data.reference_number as string | null | undefined) ?? null,
    createdAt: String(data.created_at ?? new Date().toISOString()),
  } satisfies Payment;
}

export async function deleteOrders(orderIds: string[]) {
  if (orderIds.length === 0) {
    return 0;
  }

  const client = requireSupabase();
  const { data, error } = await client.rpc('admin_delete_orders', {
    p_order_ids: orderIds,
  });

  if (error) {
    throw error;
  }

  return Number(data ?? 0);
}

export async function createStaff(input: { email: string; password: string; fullName: string; role: StaffProfile['role'] }) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke('manage-staff', {
    body: {
      action: 'create',
      ...input,
    },
  });

  if (error) {
    throw error;
  }

  return mapStaff(data as SupabaseRow);
}

export async function updateStaffRole(staffId: string, role: StaffProfile['role']) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke('manage-staff', {
    body: {
      action: 'update-role',
      staffId,
      role,
    },
  });

  if (error) {
    throw error;
  }

  return mapStaff(data as SupabaseRow);
}

export function calculateCartPreview(items: CartLine[], business: BusinessSettings | null) {
  const subtotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const taxRate = business?.taxRate ?? 0;
  const serviceChargeRate = business?.serviceChargeRate ?? 0;
  const taxAmount = subtotal * taxRate;
  const serviceChargeAmount = subtotal * serviceChargeRate;
  const total = subtotal + taxAmount + serviceChargeAmount;

  return {
    subtotal,
    taxAmount,
    serviceChargeAmount,
    total,
  };
}

export async function fetchTodayOrderTotals() {
  const client = requireSupabase();
  const { count, error } = await client
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfToday().toISOString())
    .lte('created_at', endOfToday().toISOString());

  if (error) {
    if (isPermissionError(error)) {
      return 0;
    }
    throw error;
  }

  return count ?? 0;
}
