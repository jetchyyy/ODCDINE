import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryTabs } from '../../components/menu/category-tabs';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { DataTable } from '../../components/ui/data-table';
import { EmptyState } from '../../components/ui/empty-state';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { PageHeader } from '../../components/ui/page-header';
import { StatusBadge } from '../../components/ui/status-badge';
import { useDeleteOrders, useBusinessSettings, useCategories, useCreateStaffOrder, useMenuItems, usePagedOrders, useTables } from '../../hooks/use-dashboard-queries';
import { useAuth } from '../../features/auth/use-auth';
import { useOrderRealtime } from '../../hooks/use-order-realtime';
import { ORDER_STATUSES } from '../../lib/constants/app';
import { formatCurrency } from '../../lib/utils/currency';
import { getErrorMessage } from '../../lib/utils/error';
import { calculateCartPreview } from '../../services/supabase/queries';
import type { CartLine } from '../../store/cart-store';
import type { Category, MenuItem, Order } from '../../types/domain';

interface ManualMenuPickerModalProps {
  categories: Category[];
  menuItems: MenuItem[];
  currency?: string;
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: MenuItem) => void;
}

interface ManualOrderReceipt {
  orderId: string;
  orderNumber: string;
  queueNumber: string;
  tableName: string;
  tableNumber?: number;
  items: CartLine[];
  notes: string;
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  total: number;
  currency?: string;
  createdAt: string;
}

interface ManualOrderReceiptModalProps {
  receipt: ManualOrderReceipt | null;
  onClose: () => void;
  onViewOrder: (orderId: string) => void;
}

const NO_TABLE_VALUE = '__no_table__';

function getQueueNumber(orderNumber: string) {
  const suffix = orderNumber.split('-').pop()?.trim() ?? orderNumber;
  return suffix.slice(-4).toUpperCase();
}

function printManualOrderReceipt(receipt: ManualOrderReceipt) {
  if (typeof window === 'undefined') {
    return;
  }

  const printWindow = window.open('', '_blank', 'width=480,height=720');
  if (!printWindow) {
    return;
  }

  const itemRows = receipt.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;">${item.quantity}x ${item.menuItem.name}</td>
          <td style="padding:8px 0; text-align:right;">${formatCurrency(item.menuItem.price * item.quantity, receipt.currency)}</td>
        </tr>
        ${
          item.notes
            ? `<tr><td colspan="2" style="padding:0 0 8px; color:#64748b; font-size:12px;">Note: ${item.notes}</td></tr>`
            : ''
        }
      `,
    )
    .join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>${receipt.orderNumber}</title>
      </head>
      <body style="font-family:Segoe UI, Tahoma, sans-serif; padding:24px; color:#0f172a;">
        <div style="max-width:360px; margin:0 auto;">
          <p style="margin:0; font-size:12px; letter-spacing:0.35em; text-transform:uppercase; color:#b45309;">Manual Order</p>
          <h1 style="margin:12px 0 4px; font-size:32px;">Queue ${receipt.queueNumber}</h1>
          <p style="margin:0; color:#475569;">${receipt.orderNumber}</p>
          <p style="margin:16px 0 0;">${receipt.tableName}${receipt.tableNumber ? ` • Table ${receipt.tableNumber}` : ''}</p>
          <p style="margin:4px 0 24px; color:#64748b;">${new Date(receipt.createdAt).toLocaleString()}</p>
          <table style="width:100%; border-collapse:collapse;">${itemRows}</table>
          ${
            receipt.notes
              ? `<div style="margin-top:16px; padding:12px; background:#fef3c7; border-radius:16px;"><strong>Order note:</strong> ${receipt.notes}</div>`
              : ''
          }
          <div style="margin-top:20px; border-top:1px solid #e2e8f0; padding-top:16px;">
            <p style="display:flex; justify-content:space-between; margin:6px 0;"><span>Subtotal</span><span>${formatCurrency(receipt.subtotal, receipt.currency)}</span></p>
            <p style="display:flex; justify-content:space-between; margin:6px 0;"><span>Tax</span><span>${formatCurrency(receipt.taxAmount, receipt.currency)}</span></p>
            <p style="display:flex; justify-content:space-between; margin:6px 0;"><span>Service</span><span>${formatCurrency(receipt.serviceChargeAmount, receipt.currency)}</span></p>
            <p style="display:flex; justify-content:space-between; margin:12px 0 0; font-weight:700;"><span>Total</span><span>${formatCurrency(receipt.total, receipt.currency)}</span></p>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function ManualOrderReceiptModal({ receipt, onClose, onViewOrder }: ManualOrderReceiptModalProps) {
  if (!receipt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 p-4">
      <div className="mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-700">Manual Order Created</p>
          <h3 className="mt-2 text-3xl font-semibold text-slate-900">Queue {receipt.queueNumber}</h3>
          <p className="mt-2 text-sm text-slate-600">{receipt.orderNumber}</p>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="rounded-3xl bg-amber-50 p-4 text-amber-950">
            <p className="text-sm font-semibold">Queue Number</p>
            <p className="mt-2 text-4xl font-semibold">{receipt.queueNumber}</p>
            <p className="mt-2 text-sm">{receipt.tableName}{receipt.tableNumber ? ` • Table ${receipt.tableNumber}` : ''}</p>
          </div>

          <div className="mt-5 space-y-3">
            {receipt.items.map((item) => (
              <div key={item.menuItem.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-900">{item.quantity}x {item.menuItem.name}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(item.menuItem.price * item.quantity, receipt.currency)}
                  </span>
                </div>
                {item.notes ? <p className="mt-2 text-sm text-slate-500">Note: {item.notes}</p> : null}
              </div>
            ))}
          </div>

          {receipt.notes ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <strong className="text-slate-900">Order note:</strong> {receipt.notes}
            </div>
          ) : null}

          <div className="mt-5 rounded-3xl bg-slate-50 p-4">
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(receipt.subtotal, receipt.currency)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(receipt.taxAmount, receipt.currency)}</span></div>
              <div className="flex justify-between"><span>Service</span><span>{formatCurrency(receipt.serviceChargeAmount, receipt.currency)}</span></div>
              <div className="flex justify-between font-semibold text-slate-900"><span>Total</span><span>{formatCurrency(receipt.total, receipt.currency)}</span></div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-slate-200 px-6 py-5">
          <button
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white"
            onClick={() => printManualOrderReceipt(receipt)}
            type="button"
          >
            Print details
          </button>
          <button
            className="rounded-full bg-amber-700 px-5 py-3 text-sm font-medium text-white"
            onClick={() => onViewOrder(receipt.orderId)}
            type="button"
          >
            View order
          </button>
          <button className="rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ManualMenuPickerModal({
  categories,
  menuItems,
  currency,
  isOpen,
  onClose,
  onAddItem,
}: ManualMenuPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch) ||
        item.categoryName?.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, menuItems, searchTerm]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 p-2 sm:p-4">
      <div className="mx-auto flex h-full max-h-[calc(100vh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border border-white/70 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)] sm:max-h-[calc(100vh-2rem)] sm:rounded-[2rem]">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-700">Manual Order</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Choose Menu Items</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Search by item name or filter by category so staff can add items quickly even with a large menu.
              </p>
            </div>
            <button className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 sm:self-start" onClick={onClose} type="button">
              Close
            </button>
          </div>

          <input
            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-700"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search menu items, descriptions, or categories"
            value={searchTerm}
          />

          <div className="mt-4">
            <CategoryTabs
              activeCategory={activeCategory}
              categories={[
                {
                  id: 'all',
                  name: 'All',
                  description: '',
                  sortOrder: -1,
                  isActive: true,
                  createdAt: '',
                  updatedAt: '',
                },
                ...categories,
              ]}
              onSelect={setActiveCategory}
            />
          </div>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6">
          {filteredItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <article key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.categoryName ?? 'Menu Item'}</p>
                      <h4 className="mt-2 text-lg font-semibold text-slate-900">{item.name}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {item.preparationTimeMinutes} min
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-lg font-semibold text-slate-900">{formatCurrency(item.price, currency)}</span>
                    <button
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                      onClick={() => onAddItem(item)}
                      type="button"
                    >
                      Add item
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No matching items" description="Try a different search term or switch to another category." />
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminOrdersPage() {
  const PAGE_SIZE_OPTIONS = [10, 25, 50];
  const navigate = useNavigate();
  const { profile } = useAuth();
  useOrderRealtime();
  const { data: tables = [] } = useTables();
  const { data: categories = [] } = useCategories({ activeOnly: true });
  const { data: menuItems = [] } = useMenuItems({ activeOnly: true });
  const { data: business } = useBusinessSettings();
  const createStaffOrderMutation = useCreateStaffOrder();
  const deleteOrdersMutation = useDeleteOrders();
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [tableFilter, setTableFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [manualTableId, setManualTableId] = useState('');
  const [manualOrderNote, setManualOrderNote] = useState('');
  const [manualItems, setManualItems] = useState<CartLine[]>([]);
  const [manualOrderError, setManualOrderError] = useState<string | null>(null);
  const [menuPickerOpen, setMenuPickerOpen] = useState(false);
  const [manualReceipt, setManualReceipt] = useState<ManualOrderReceipt | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const pagedOrdersQuery = usePagedOrders({
    page,
    pageSize,
    status: statusFilter,
    tableId: tableFilter,
  });

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === manualTableId) ?? null,
    [manualTableId, tables],
  );

  const manualTotals = useMemo(
    () => calculateCartPreview(manualItems, business ?? null),
    [business, manualItems],
  );
  const pagedOrders = pagedOrdersQuery.data?.orders ?? [];
  const totalCount = pagedOrdersQuery.data?.totalCount ?? 0;
  const totalPages = pagedOrdersQuery.data?.totalPages ?? 0;
  const pageStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);
  const canDeleteOrders = profile?.role === 'admin';
  const pageOrderIds = pagedOrders.map((order) => order.id);
  const allPageOrdersSelected = pageOrderIds.length > 0 && pageOrderIds.every((orderId) => selectedOrderIds.includes(orderId));
  const selectedCount = selectedOrderIds.length;

  useEffect(() => {
    setSelectedOrderIds((currentIds) => currentIds.filter((orderId) => pageOrderIds.includes(orderId)));
  }, [pageOrderIds]);

  useEffect(() => {
    if (page > 1 && totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }

    if (totalPages === 0 && page !== 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  function addManualItem(menuItem: MenuItem) {
    setManualItems((currentItems) => {
      const existing = currentItems.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return currentItems.map((item) =>
          item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...currentItems, { menuItem, quantity: 1 }];
    });
  }

  function updateManualQuantity(menuItemId: string, quantity: number) {
    setManualItems((currentItems) =>
      currentItems
        .map((item) => (item.menuItem.id === menuItemId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  }

  function updateManualItemNotes(menuItemId: string, notes: string) {
    setManualItems((currentItems) =>
      currentItems.map((item) => (item.menuItem.id === menuItemId ? { ...item, notes } : item)),
    );
  }

  async function handleCreateManualOrder() {
    setManualOrderError(null);

    if (!manualTableId) {
      setManualOrderError('Select a table or choose No table before creating a manual order.');
      return;
    }

    if (manualItems.length === 0) {
      setManualOrderError('Add at least one menu item to the manual order.');
      return;
    }

    try {
      const receiptItems = manualItems.map((item) => ({ ...item }));
      const receiptNotes = manualOrderNote;
      const receiptTable = selectedTable;
      const receiptTotals = manualTotals;
      const result = await createStaffOrderMutation.mutateAsync({
        tableId: manualTableId === NO_TABLE_VALUE ? null : selectedTable?.id ?? null,
        items: manualItems,
        notes: manualOrderNote,
      });

      setManualItems([]);
      setManualOrderNote('');
      setManualReceipt({
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        queueNumber: result.queueNumber ?? getQueueNumber(result.orderNumber),
        tableName: receiptTable?.tableName ?? 'Walk-in / No table',
        tableNumber: receiptTable?.tableNumber,
        items: receiptItems,
        notes: receiptNotes,
        subtotal: receiptTotals.subtotal,
        taxAmount: receiptTotals.taxAmount,
        serviceChargeAmount: receiptTotals.serviceChargeAmount,
        total: receiptTotals.total,
        currency: business?.currency,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      setManualOrderError(getErrorMessage(error, 'Unable to create manual order.'));
    }
  }

  function toggleOrderSelection(orderId: string) {
    setSelectedOrderIds((currentIds) =>
      currentIds.includes(orderId) ? currentIds.filter((currentId) => currentId !== orderId) : [...currentIds, orderId],
    );
  }

  function toggleSelectAllPageOrders() {
    setSelectedOrderIds((currentIds) => {
      if (allPageOrdersSelected) {
        return currentIds.filter((orderId) => !pageOrderIds.includes(orderId));
      }

      return [...new Set([...currentIds, ...pageOrderIds])];
    });
  }

  async function handleDeleteOrders() {
    if (deleteTargetIds.length === 0) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteOrdersMutation.mutateAsync(deleteTargetIds);
      setSelectedOrderIds((currentIds) => currentIds.filter((orderId) => !deleteTargetIds.includes(orderId)));
      setDeleteTargetIds([]);

      if (deleteTargetIds.length >= pagedOrders.length && page > 1) {
        setPage((currentPage) => Math.max(1, currentPage - 1));
      }
    } catch (error) {
      setDeleteError(getErrorMessage(error, 'Unable to delete the selected order(s).'));
      setDeleteTargetIds([]);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Orders Dashboard"
        description="Monitor incoming QR orders in real time, filter by status or table, drill into each order for item details and status updates, and create staff-assisted orders when needed."
      />

      <section className="glass-panel space-y-5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-700">Manual Order</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Create Staff-Assisted Order</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Use this when a guest prefers to order through staff instead of scanning the table QR code.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:min-w-[240px]">
            {manualItems.length} item(s) • {formatCurrency(manualTotals.total, business?.currency)}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <select
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            onChange={(event) => setManualTableId(event.target.value)}
            value={manualTableId}
          >
            <option value="">Select table</option>
            <option value={NO_TABLE_VALUE}>No table / Walk-in</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.tableName} {table.tableNumber ? `(#${table.tableNumber})` : ''}
              </option>
            ))}
          </select>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Browse the menu in a searchable modal instead of a long dropdown list.
          </div>

          <button
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white md:col-span-2 xl:col-span-1"
            onClick={() => setMenuPickerOpen(true)}
            type="button"
          >
            Browse menu
          </button>
        </div>

        {manualItems.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {manualItems.map((item) => (
              <article key={item.menuItem.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.menuItem.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{formatCurrency(item.menuItem.price, business?.currency)}</p>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      className="h-11 w-11 rounded-full bg-slate-100 text-slate-700"
                      onClick={() => updateManualQuantity(item.menuItem.id, item.quantity - 1)}
                      type="button"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-semibold">{item.quantity}</span>
                    <button
                      className="h-11 w-11 rounded-full bg-slate-900 text-white"
                      onClick={() => updateManualQuantity(item.menuItem.id, item.quantity + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
                <textarea
                  className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-700"
                  onChange={(event) => updateManualItemNotes(item.menuItem.id, event.target.value)}
                  placeholder="Item note"
                  rows={2}
                  value={item.notes ?? ''}
                />
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No items added yet" description="Pick a table and add menu items to create a manual order." />
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <label className="text-sm text-slate-600">
              Whole order note
              <textarea
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-700"
                onChange={(event) => setManualOrderNote(event.target.value)}
                placeholder="Serve drinks first, allergies, no ice, etc."
                rows={3}
                value={manualOrderNote}
              />
            </label>
          </div>

          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(manualTotals.subtotal, business?.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax</span>
                <span>{formatCurrency(manualTotals.taxAmount, business?.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Service charge</span>
                <span>{formatCurrency(manualTotals.serviceChargeAmount, business?.currency)}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Estimated total</p>
                <p className="text-2xl font-semibold text-slate-900">{formatCurrency(manualTotals.total, business?.currency)}</p>
              </div>
              <button
                className="rounded-full bg-amber-700 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
                disabled={createStaffOrderMutation.isPending}
                onClick={() => {
                  void handleCreateManualOrder();
                }}
                type="button"
              >
                {createStaffOrderMutation.isPending ? 'Creating...' : 'Create order'}
              </button>
            </div>
            {manualOrderError ? <p className="mt-3 text-sm text-rose-600">{manualOrderError}</p> : null}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as typeof statusFilter);
            setPage(1);
          }}
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
        <select
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
          value={tableFilter}
          onChange={(event) => {
            setTableFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All tables</option>
          {tables.map((table) => (
            <option key={table.id} value={table.id}>
              {table.tableName}
            </option>
          ))}
        </select>
        <select
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
          value={String(pageSize)}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(1);
          }}
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option} per page
            </option>
          ))}
        </select>
        {canDeleteOrders ? (
          <button
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={selectedCount === 0 || deleteOrdersMutation.isPending}
            onClick={() => setDeleteTargetIds(selectedOrderIds)}
            type="button"
          >
            Delete selected ({selectedCount})
          </button>
        ) : null}
      </div>

      {deleteError ? <p className="text-sm text-rose-600">{deleteError}</p> : null}

      {pagedOrdersQuery.isLoading ? <LoadingSpinner label="Loading orders..." /> : null}

      <DataTable<Order>
        rows={pagedOrders}
        getRowKey={(row) => row.id}
        emptyState={<EmptyState title="No orders found" description="Orders will appear here as soon as customers place them from table QR codes." />}
        columns={[
          ...(canDeleteOrders
            ? [
                {
                  key: 'select',
                  header: (
                    <input
                      aria-label="Select all orders on this page"
                      checked={allPageOrdersSelected}
                      className="h-4 w-4 rounded border-slate-300"
                      onChange={toggleSelectAllPageOrders}
                      type="checkbox"
                    />
                  ),
                  render: (order: Order) => (
                    <input
                      aria-label={`Select order ${order.orderNumber}`}
                      checked={selectedOrderIds.includes(order.id)}
                      className="h-4 w-4 rounded border-slate-300"
                      onChange={() => toggleOrderSelection(order.id)}
                      type="checkbox"
                    />
                  ),
                  className: 'w-12',
                },
              ]
            : []),
          {
            key: 'order',
            header: 'Order',
            render: (order) => (
              <div>
                {order.queueNumber ? <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Queue {order.queueNumber}</p> : null}
                <button
                  className="font-semibold text-slate-900"
                  onClick={() => {
                    void navigate(`/admin/orders/${order.id}`);
                  }}
                  type="button"
                >
                  {order.orderNumber}
                </button>
                <p className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            ),
          },
          {
            key: 'table',
            header: 'Table',
            render: (order) => (order.tableId ? `${order.tableName}${order.tableNumber ? ` (#${order.tableNumber})` : ''}` : 'Walk-in / No table'),
          },
          { key: 'status', header: 'Status', render: (order) => <StatusBadge status={order.status} /> },
          {
            key: 'payment',
            header: 'Payment',
            render: (order) => (
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  order.payment?.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.payment?.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
              </span>
            ),
          },
          { key: 'notes', header: 'Notes', render: (order) => order.notes ?? 'No notes' },
          { key: 'items', header: 'Items', render: (order) => `${order.items.length} item(s)` },
          { key: 'total', header: 'Total', render: (order) => formatCurrency(order.total) },
          ...(canDeleteOrders
            ? [
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (order: Order) => (
                    <button
                      className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                      onClick={() => setDeleteTargetIds([order.id])}
                      type="button"
                    >
                      Delete
                    </button>
                  ),
                },
              ]
            : []),
        ]}
      />

      <div className="glass-panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-600">
          Showing {pageStart}-{pageEnd} of {totalCount} order(s)
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            type="button"
          >
            Previous
          </button>
          <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-600">
            Page {totalPages === 0 ? 0 : page} of {totalPages}
          </div>
          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={totalPages === 0 || page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            type="button"
          >
            Next
          </button>
        </div>
      </div>

      <ManualMenuPickerModal
        categories={categories}
        currency={business?.currency}
        isOpen={menuPickerOpen}
        menuItems={menuItems}
        onAddItem={(item) => {
          addManualItem(item);
        }}
        onClose={() => setMenuPickerOpen(false)}
      />
      <ManualOrderReceiptModal
        receipt={manualReceipt}
        onClose={() => setManualReceipt(null)}
        onViewOrder={(orderId) => {
          setManualReceipt(null);
          void navigate(`/admin/orders/${orderId}`);
        }}
      />
      <ConfirmDialog
        cancelLabel="Keep orders"
        confirmLabel={deleteTargetIds.length > 1 ? `Delete ${deleteTargetIds.length} orders` : 'Delete order'}
        confirmTone="danger"
        description={
          deleteTargetIds.length > 1
            ? `Delete ${deleteTargetIds.length} selected orders? Their items, payments, and status logs will also be removed.`
            : 'Delete this order? Its items, payment, and status history will also be removed.'
        }
        isOpen={deleteTargetIds.length > 0}
        isPending={deleteOrdersMutation.isPending}
        onCancel={() => setDeleteTargetIds([])}
        onConfirm={() => {
          void handleDeleteOrders();
        }}
        title={deleteTargetIds.length > 1 ? 'Delete selected orders?' : 'Delete this order?'}
      />
    </div>
  );
}
