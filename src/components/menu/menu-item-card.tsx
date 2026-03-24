import { Star } from 'lucide-react';
import { formatCurrency } from '../../lib/utils/currency';
import type { MenuItem } from '../../types/domain';

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  return (
    <article className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_40px_rgba(84,64,35,0.08)]">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-48 items-center justify-center bg-[linear-gradient(135deg,#f6e7d8,#d7ebe7)] text-2xl font-semibold text-slate-700">
          {item.name.slice(0, 1)}
        </div>
      )}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </div>
          {item.isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              <Star className="h-3 w-3" />
              Featured
            </span>
          ) : null}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(item.price)}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.preparationTimeMinutes} min prep</p>
          </div>
          <button onClick={() => onAdd(item)} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="button">
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
