import { OrderCard } from '../../components/orders/order-card';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { useOrders, useUpdateOrderStatus } from '../../hooks/use-dashboard-queries';
import { useOrderRealtime } from '../../hooks/use-order-realtime';
import { ACTIVE_KITCHEN_STATUSES } from '../../lib/constants/app';

export function KitchenOrdersPage() {
  useOrderRealtime();
  const { data = [] } = useOrders();
  const statusMutation = useUpdateOrderStatus();
  const activeOrders = data.filter((order) => ACTIVE_KITCHEN_STATUSES.includes(order.status));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Kitchen"
        title="Active Kitchen Orders"
        description="Focus on the active queue only. This board is optimized for large, readable cards and fast status changes during service."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {activeOrders.length > 0 ? (
          activeOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              allowedStatuses={['preparing', 'ready_to_serve']}
              onStatusChange={(orderId, status) => {
                void statusMutation.mutateAsync({ orderId, status });
              }}
              statusPending={statusMutation.isPending}
            />
          ))
        ) : (
          <EmptyState title="No active kitchen orders" description="New confirmed orders will appear here automatically through realtime updates." />
        )}
      </div>
    </div>
  );
}
