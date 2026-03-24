import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CategoryTabs } from '../../components/menu/category-tabs';
import { MenuItemCard } from '../../components/menu/menu-item-card';
import { EmptyState } from '../../components/ui/empty-state';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { usePublicTableContext } from '../../hooks/use-dashboard-queries';
import { calculateCartPreview } from '../../services/supabase/queries';
import { useCartStore } from '../../store/cart-store';
import type { MenuItem } from '../../types/domain';

export function MenuPage() {
  const { tableCode = '' } = useParams();
  const { data, isLoading } = usePublicTableContext(tableCode);
  const [selectedCategory, setSelectedCategory] = useState('');
  const addItem = useCartStore((state) => state.addItem);
  const setTableCode = useCartStore((state) => state.setTableCode);
  const cartItems = useCartStore((state) => state.items);

  useEffect(() => {
    if (tableCode) {
      setTableCode(tableCode);
    }
  }, [setTableCode, tableCode]);

  const activeCategory = selectedCategory || data?.categories[0]?.id || '';

  const visibleItems = useMemo(
    () => (data?.menuItems ?? []).filter((item) => !activeCategory || item.categoryId === activeCategory),
    [activeCategory, data?.menuItems],
  );

  const preview = calculateCartPreview(cartItems, data?.business ?? null);

  if (isLoading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center p-6">
        <LoadingSpinner label="Loading menu..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-shell px-4 py-6 md:px-6">
        <div className="mx-auto max-w-4xl">
          <EmptyState
            title="Invalid table QR"
            description="This table code is not active anymore. Ask staff for a fresh table QR and try again."
          />
        </div>
      </div>
    );
  }

  const handleAdd = (item: MenuItem) => {
    setTableCode(tableCode);
    addItem(item);
  };

  return (
    <div className="page-shell px-4 py-6 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="glass-panel overflow-hidden">
          <div className="bg-[linear-gradient(135deg,#16324f,#2c6e6a)] px-5 py-8 text-white md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amber-200">QR Ordering</p>
                <h1 className="mt-3 text-4xl font-semibold">{data.business?.businessName ?? 'Restaurant Menu'}</h1>
                <p className="mt-2 text-sm text-slate-100">Table {data.table.tableNumber}: {data.table.tableName}</p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-100">
                  Browse the live menu, add notes per item, and send your order straight to the staff dashboard and kitchen board.
                </p>
              </div>
              {data.business?.logoUrl ? (
                <img src={data.business.logoUrl} alt={data.business.businessName} className="h-20 w-20 rounded-3xl object-cover" />
              ) : null}
            </div>
          </div>

          <div className="space-y-5 p-5 md:p-8">
            <CategoryTabs categories={data.categories} activeCategory={activeCategory} onSelect={setSelectedCategory} />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <MenuItemCard key={item.id} item={item} onAdd={handleAdd} />
              ))}
            </div>
            {visibleItems.length === 0 ? (
              <EmptyState title="No items in this category" description="This category exists, but there are no active menu items in it yet." />
            ) : null}
          </div>
        </section>

        <div className="sticky bottom-4 z-10">
          <div className="glass-panel flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm text-slate-500">{cartItems.length} item(s) in cart</p>
              <p className="text-lg font-semibold text-slate-900">{preview.total.toFixed(2)} {data.business?.currency ?? 'PHP'}</p>
            </div>
            <Link to={`/cart/${tableCode}`} className="rounded-full bg-amber-700 px-5 py-3 text-sm font-semibold text-white">
              Review cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
