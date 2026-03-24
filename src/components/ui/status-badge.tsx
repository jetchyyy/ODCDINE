import { humanizeStatus } from '../../lib/utils/status';
import type { OrderStatus } from '../../types/domain';

const styleMap: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-sky-100 text-sky-900',
  preparing: 'bg-orange-100 text-orange-900',
  ready_to_serve: 'bg-emerald-100 text-emerald-900',
  served: 'bg-lime-100 text-lime-900',
  completed: 'bg-slate-200 text-slate-800',
  cancelled: 'bg-rose-100 text-rose-900',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styleMap[status]}`}>{humanizeStatus(status)}</span>;
}
