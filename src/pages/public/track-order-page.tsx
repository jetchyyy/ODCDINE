import { useParams } from 'react-router-dom';
import { EmptyState } from '../../components/ui/empty-state';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { StatusBadge } from '../../components/ui/status-badge';
import { usePublicOrder } from '../../hooks/use-dashboard-queries';
import { useOrderRealtime } from '../../hooks/use-order-realtime';
import { formatCurrency } from '../../lib/utils/currency';
import { humanizeStatus } from '../../lib/utils/status';

export function TrackOrderPage() {
  const { orderId } = useParams();
  useOrderRealtime({ orderId });
  const { data: order, isLoading } = usePublicOrder(orderId);

  if (isLoading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center p-6">
        <LoadingSpinner label="Loading order status..." />
      </div>
    );
  }

  if (!order) {
    return <EmptyState title="No active order" description="This order could not be found, or the tracking link is invalid." />;
  }

  return (
    <div className="page-shell px-4 py-6 md:px-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="glass-panel p-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700">Order Tracking</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">{order.orderNumber}</h1>
          <div className="mt-4 flex justify-center">
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Your order status updates live as staff confirm, prepare, and serve the items.
          </p>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold text-slate-900">Items</h2>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-900">{item.quantity}x {item.itemName}</span>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.lineTotal)}</span>
                </div>
                {item.notes ? <p className="mt-2 text-sm text-slate-500">Note: {item.notes}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold text-slate-900">Status Timeline</h2>
          <div className="mt-4 space-y-3">
            {order.statusLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-900">{humanizeStatus(log.status)}</p>
                  <p className="mt-1 text-sm text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                {log.changedByName ? <p className="text-sm text-slate-500">{log.changedByName}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
