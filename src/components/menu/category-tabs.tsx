import { cn } from '../../lib/utils/cn';
import type { Category } from '../../types/domain';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (categoryId: string) => void;
}

export function CategoryTabs({ categories, activeCategory, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition',
            activeCategory === category.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100',
          )}
          type="button"
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
