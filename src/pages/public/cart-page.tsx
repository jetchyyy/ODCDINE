import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/ui/empty-state';
import { useBusinessSettings, useCreatePublicOrder } from '../../hooks/use-dashboard-queries';
import { formatCurrency } from '../../lib/utils/currency';
import { getErrorMessage } from '../../lib/utils/error';
import { calculateCartPreview } from '../../services/supabase/queries';
import { useCartStore } from '../../store/cart-store';

export function CartPage() {
  const navigate = useNavigate();
  const { tableCode = '' } = useParams();
  const { data: business } = useBusinessSettings();
  const items = useCartStore((state) => state.items);
  const orderNote = useCartStore((state) => state.orderNote);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const updateNotes = useCartStore((state) => state.updateNotes);
  const setOrderNote = useCartStore((state) => state.setOrderNote);
  const clearCart = useCartStore((state) => state.clearCart);
  const createOrderMutation = useCreatePublicOrder();

  const totals = calculateCartPreview(items, business ?? null);

  async function handlePlaceOrder() {
    if (!tableCode || items.length === 0) {
      return;
    }

    const result = await createOrderMutation.mutateAsync({
      tableCode,
      items,
      notes: orderNote,
    });

    clearCart();
    navigate(`/track/${result.orderId}`);
  }

  if (items.length === 0) {
    return (
      <div className="page-shell px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title="Your cart is empty"
            description="Scan a table QR, add some items from the live menu, and they will appear here."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell px-4 py-6 md:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="glass-panel p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700">Cart</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Table {tableCode}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Review your items, add per-item instructions, then place the order for this table.
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.menuItem.id} className="glass-panel flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.menuItem.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{formatCurrency(item.menuItem.price, business?.currency)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                    className="h-10 w-10 rounded-full bg-slate-900 text-white"
                    type="button"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                    className="h-10 w-10 rounded-full bg-slate-900 text-white"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600">
                  Item note
                  <textarea
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-700"
                    onChange={(event) => updateNotes(item.menuItem.id, event.target.value)}
                    placeholder="No onions, extra hot, serve later..."
                    rows={2}
                    value={item.notes ?? ''}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>

        <div className="glass-panel p-5">
          <label className="text-sm text-slate-600">
            Whole order note
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-700"
              onChange={(event) => setOrderNote(event.target.value)}
              placeholder="Please serve drinks first, allergic to peanuts, etc."
              rows={3}
              value={orderNote}
            />
          </label>
        </div>

        <div className="sticky bottom-4 glass-panel p-5">
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal, business?.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tax</span>
              <span>{formatCurrency(totals.taxAmount, business?.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Service charge</span>
              <span>{formatCurrency(totals.serviceChargeAmount, business?.currency)}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Estimated total</p>
              <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totals.total, business?.currency)}</p>
            </div>
            <button
              className="rounded-full bg-amber-700 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
              disabled={createOrderMutation.isPending}
              onClick={() => {
                void handlePlaceOrder();
              }}
              type="button"
            >
              {createOrderMutation.isPending ? 'Placing order...' : 'Place order'}
            </button>
          </div>
          {createOrderMutation.error ? (
            <p className="mt-3 text-sm text-rose-600">{getErrorMessage(createOrderMutation.error, 'Unable to create the order.')}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
