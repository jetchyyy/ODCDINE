import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/ui/data-table';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { StatusBadge } from '../../components/ui/status-badge';
import { useOrders, useTables } from '../../hooks/use-dashboard-queries';
import { useOrderRealtime } from '../../hooks/use-order-realtime';
import { ORDER_STATUSES } from '../../lib/constants/app';
import { formatCurrency } from '../../lib/utils/currency';
import type { Order } from '../../types/domain';

export function AdminOrdersPage() {
  useOrderRealtime();
  const { data: orders = [] } = useOrders();
  const { data: tables = [] } = useTables();
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [tableFilter, setTableFilter] = useState('all');

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesTable = tableFilter === 'all' || order.tableId === tableFilter;
        return matchesStatus && matchesTable;
      }),
    [orders, statusFilter, tableFilter],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Orders Dashboard"
        description="Monitor incoming QR orders in real time, filter by status or table, and drill into each order for item details and status updates."
      />

      <div className="flex flex-wrap gap-2">
        <select className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
        <select className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm" value={tableFilter} onChange={(event) => setTableFilter(event.target.value)}>
          <option value="all">All tables</option>
          {tables.map((table) => (
            <option key={table.id} value={table.id}>
              {table.tableName}
            </option>
          ))}
        </select>
      </div>

      <DataTable<Order>
        rows={filteredOrders}
        getRowKey={(row) => row.id}
        emptyState={<EmptyState title="No orders found" description="Orders will appear here as soon as customers place them from table QR codes." />}
        columns={[
          {
            key: 'order',
            header: 'Order',
            render: (order) => (
              <div>
                <Link to={`/admin/orders/${order.id}`} className="font-semibold text-slate-900">
                  {order.orderNumber}
                </Link>
                <p className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            ),
          },
          { key: 'table', header: 'Table', render: (order) => `${order.tableName}${order.tableNumber ? ` (#${order.tableNumber})` : ''}` },
          { key: 'status', header: 'Status', render: (order) => <StatusBadge status={order.status} /> },
          { key: 'notes', header: 'Notes', render: (order) => order.notes ?? 'No notes' },
          { key: 'items', header: 'Items', render: (order) => `${order.items.length} item(s)` },
          { key: 'total', header: 'Total', render: (order) => formatCurrency(order.total) },
        ]}
      />
    </div>
  );
}
