import { useParams } from 'react-router-dom';
import { OrderStatusActions } from '../../components/orders/order-status-actions';
import { EmptyState } from '../../components/ui/empty-state';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { PageHeader } from '../../components/ui/page-header';
import { StatusBadge } from '../../components/ui/status-badge';
import { useOrder, useUpdateOrderStatus } from '../../hooks/use-dashboard-queries';
import { useOrderRealtime } from '../../hooks/use-order-realtime';
import { formatCurrency } from '../../lib/utils/currency';

export function AdminOrderDetailsPage() {
  const { id } = useParams();
  const statusMutation = useUpdateOrderStatus();
  const { data: order, isLoading } = useOrder(id);
  useOrderRealtime({ orderId: id });

  if (isLoading) {
    return <LoadingSpinner label="Loading order..." />;
  }

  if (!order) {
    return <EmptyState title="Order not found" description="This order could not be found." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={order.orderNumber}
        title={order.tableName}
        description="Review the full order breakdown, customer notes, audit trail, and staff status updates."
        actions={<StatusBadge status={order.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-slate-900">Items</h3>
          <div className="mt-6 grid gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{item.quantity}x {item.itemName}</p>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.lineTotal)}</p>
                </div>
                {item.notes ? <p className="mt-2 text-sm text-slate-500">Note: {item.notes}</p> : null}
              </div>
            ))}
          </div>

          {order.notes ? (
            <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              <strong>Order note:</strong> {order.notes}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold text-slate-900">Totals</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.taxAmount)}</span></div>
              <div className="flex justify-between"><span>Service</span><span>{formatCurrency(order.serviceChargeAmount)}</span></div>
              <div className="flex justify-between font-semibold text-slate-900"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold text-slate-900">Update Status</h3>
            <div className="mt-4">
              <OrderStatusActions
                currentStatus={order.status}
                disabled={statusMutation.isPending}
                onChange={(status) => {
                  void statusMutation.mutateAsync({ orderId: order.id, status });
                }}
              />
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold text-slate-900">Status Log</h3>
            <div className="mt-4 space-y-3">
              {order.statusLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">{log.status.replaceAll('_', ' ')}</p>
                  <p className="mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                  {log.changedByName ? <p className="mt-1 text-xs text-slate-500">By {log.changedByName}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
