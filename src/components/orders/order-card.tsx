import { formatDistanceToNow } from 'date-fns';
import { formatCurrency } from '../../lib/utils/currency';
import type { Order, OrderStatus } from '../../types/domain';
import { StatusBadge } from '../ui/status-badge';
import { OrderStatusActions } from './order-status-actions';

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
  statusPending?: boolean;
  allowedStatuses?: OrderStatus[];
}

export function OrderCard({ order, onStatusChange, statusPending, allowedStatuses }: OrderCardProps) {
  return (
    <article className="glass-panel space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-700">{order.orderNumber}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{order.tableName}</h3>
          <p className="mt-1 text-sm text-slate-500">Table {order.tableNumber ?? 'N/A'}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ul className="space-y-2 text-sm text-slate-600">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-2">
            <span>{item.quantity}x {item.itemName}</span>
            <span>{formatCurrency(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      {order.notes ? (
        <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Order note:</strong> {order.notes}
        </div>
      ) : null}

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
        <span className="font-semibold text-slate-900">{formatCurrency(order.total)}</span>
      </div>

      {onStatusChange ? (
        <OrderStatusActions
          currentStatus={order.status}
          disabled={statusPending}
          allowedStatuses={allowedStatuses}
          onChange={(status) => onStatusChange(order.id, status)}
        />
      ) : null}
    </article>
  );
}
