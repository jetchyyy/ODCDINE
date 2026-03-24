import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/ui/data-table';
import { EmptyState } from '../../components/ui/empty-state';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { PageHeader } from '../../components/ui/page-header';
import { useBusinessSettings, usePagedSales, useTables } from '../../hooks/use-dashboard-queries';
import { formatCurrency } from '../../lib/utils/currency';
import type { Order } from '../../types/domain';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export function AdminSalesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [tableFilter, setTableFilter] = useState('all');
  const { data: business } = useBusinessSettings();
  const { data: tables = [] } = useTables();
  const salesQuery = usePagedSales({
    page,
    pageSize,
    tableId: tableFilter,
  });

  const paidOrders = salesQuery.data?.orders ?? [];
  const totalCount = salesQuery.data?.totalCount ?? 0;
  const totalPages = salesQuery.data?.totalPages ?? 0;
  const pageStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Sales Tracker"
        description="Review paid orders only with server-side pagination, so the list stays responsive even as your payment history grows."
      />

      <section className="glass-panel space-y-4 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Paid Orders</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Transaction History</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              This view only loads one page of paid orders at a time from Supabase, which keeps the screen scalable for large datasets.
            </p>
          </div>
          <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {totalCount} paid order(s)
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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
        </div>

        {salesQuery.isLoading ? <LoadingSpinner label="Loading sales..." /> : null}

        <DataTable<Order>
          rows={paidOrders}
          getRowKey={(row) => row.id}
          emptyState={
            <EmptyState
              title="No paid orders found"
              description="Paid transactions will appear here once orders are marked as paid."
            />
          }
          columns={[
            {
              key: 'order',
              header: 'Order',
              render: (order) => (
                <div>
                  {order.queueNumber ? <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">Queue {order.queueNumber}</p> : null}
                  <Link to={`/admin/orders/${order.id}`} className="font-semibold text-slate-900">
                    {order.orderNumber}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              ),
            },
            {
              key: 'table',
              header: 'Table',
              render: (order) => (order.tableId ? `${order.tableName}${order.tableNumber ? ` (#${order.tableNumber})` : ''}` : 'Walk-in / No table'),
            },
            {
              key: 'items',
              header: 'Items',
              render: (order) => `${order.items.length} item(s)`,
            },
            {
              key: 'paymentMethod',
              header: 'Method',
              render: (order) => (order.payment?.paymentMethod ? order.payment.paymentMethod.replaceAll('_', ' ') : 'Unknown'),
            },
            {
              key: 'amountPaid',
              header: 'Amount Paid',
              render: (order) => formatCurrency(order.payment?.amountPaid ?? order.total, business?.currency),
            },
            {
              key: 'status',
              header: 'Payment',
              render: () => <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Paid</span>,
            },
            {
              key: 'paidAt',
              header: 'Paid At',
              render: (order) => new Date(order.payment?.createdAt ?? order.updatedAt).toLocaleString(),
            },
          ]}
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            Showing {pageStart}-{pageEnd} of {totalCount} paid order(s)
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
      </section>
    </div>
  );
}
