import { Pencil, Printer } from 'lucide-react';
import type { RestaurantTable } from '../../types/domain';

interface TableCardProps {
  table: RestaurantTable;
  qrUrl: string;
  onEdit: (table: RestaurantTable) => void;
  onToggleActive: (table: RestaurantTable) => void;
  onDownload: (table: RestaurantTable) => void;
}

export function TableCard({ table, qrUrl, onEdit, onToggleActive, onDownload }: TableCardProps) {
  return (
    <article className="glass-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Table {table.tableNumber}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{table.tableName}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${table.isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
          {table.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="mt-4 space-y-1 text-sm text-slate-600">
        <p>Capacity: {table.capacity} guests</p>
        <p>Secure code: {table.tableCode}</p>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500 break-all">{qrUrl}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white" onClick={() => onEdit(table)} type="button">
          <span className="inline-flex items-center gap-2"><Pencil className="h-4 w-4" />Edit</span>
        </button>
        <button className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700" onClick={() => onToggleActive(table)} type="button">
          {table.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700" onClick={() => onDownload(table)} type="button">
          <span className="inline-flex items-center gap-2"><Printer className="h-4 w-4" />Download QR</span>
        </button>
      </div>
    </article>
  );
}
