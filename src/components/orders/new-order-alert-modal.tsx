import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils/currency';
import type { Order } from '../../types/domain';

interface NewOrderAlertModalProps {
  area: 'admin' | 'kitchen';
  order: Order | null;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
  confirmPending?: boolean;
}

export function NewOrderAlertModal({ area, order, onClose, onConfirm, confirmPending }: NewOrderAlertModalProps) {
  if (!order) {
    return null;
  }

  const destination = area === 'admin' ? `/admin/orders/${order.id}` : '/kitchen/orders';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <p className="text-xs uppercase tracking-[0.35em] text-rose-700">New Order</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">{order.orderNumber}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {order.tableName}
          {order.tableNumber ? ` • Table ${order.tableNumber}` : ''}
        </p>

        <div className="mt-5 rounded-3xl bg-rose-50 p-4">
          <div className="flex items-center justify-between gap-3 text-sm text-rose-900">
            <span>{order.items.length} item(s)</span>
            <span className="font-semibold">{formatCurrency(order.total)}</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-rose-950">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantity}x {item.itemName}
              </li>
            ))}
          </ul>
        </div>

        {order.notes ? (
          <div className="mt-4 rounded-3xl bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Customer note:</strong> {order.notes}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
            disabled={confirmPending}
            onClick={() => onConfirm(order.id)}
            type="button"
          >
            {confirmPending ? 'Confirming...' : 'Confirm order'}
          </button>
          <Link
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white"
            onClick={onClose}
            to={destination}
          >
            View order
          </Link>
          <button className="rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700" onClick={onClose} type="button">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
