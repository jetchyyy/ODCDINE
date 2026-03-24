import { ORDER_STATUSES } from '../../lib/constants/app';
import { humanizeStatus } from '../../lib/utils/status';
import type { OrderStatus } from '../../types/domain';

interface OrderStatusActionsProps {
  currentStatus: OrderStatus;
  onChange: (status: OrderStatus) => void;
  disabled?: boolean;
  allowedStatuses?: OrderStatus[];
}

export function OrderStatusActions({ currentStatus, onChange, disabled, allowedStatuses }: OrderStatusActionsProps) {
  const statuses = allowedStatuses ?? ORDER_STATUSES;

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          className={`rounded-full px-3 py-2 text-xs font-medium ${
            currentStatus === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
          } disabled:opacity-50`}
          disabled={disabled || currentStatus === status}
          onClick={() => onChange(status)}
          type="button"
        >
          {humanizeStatus(status)}
        </button>
      ))}
    </div>
  );
}
