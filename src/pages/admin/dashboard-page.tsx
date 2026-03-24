import { OrderCard } from '../../components/orders/order-card';
import { EmptyState } from '../../components/ui/empty-state';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { PageHeader } from '../../components/ui/page-header';
import { StatCard } from '../../components/ui/stat-card';
import { useAnalytics, useOrders } from '../../hooks/use-dashboard-queries';
import { useOrderRealtime } from '../../hooks/use-order-realtime';
import { formatCurrency } from '../../lib/utils/currency';

export function AdminDashboardPage() {
  useOrderRealtime();
  const analyticsQuery = useAnalytics();
  const ordersQuery = useOrders();

  if (analyticsQuery.isLoading || ordersQuery.isLoading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  const analytics = analyticsQuery.data;
  const orders = ordersQuery.data ?? [];

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Operations Dashboard"
        description="Track live order volume, revenue snapshots, and recent activity across the restaurant from a single admin workspace."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Sales" value={formatCurrency(analytics.todaySales)} hint="Gross sales created today." />
        <StatCard label="Today's Orders" value={String(analytics.todayOrders)} hint="Orders submitted from table QR flows today." />
        <StatCard label="Average Order" value={formatCurrency(analytics.averageOrderValue)} hint="Average ticket across all tracked orders." />
        <StatCard label="Cancelled" value={String(analytics.cancelledOrders)} hint="Cancelled orders for the current dataset." />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-slate-900">How this deployment is structured</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Customer</p>
              <p className="mt-2 text-sm text-amber-800">QR menu, cart, checkout, and live tracking on the guest phone.</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-sm font-semibold text-sky-900">Admin</p>
              <p className="mt-2 text-sm text-sky-800">Tables, menu, settings, analytics, and staff roles.</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-900">Kitchen</p>
              <p className="mt-2 text-sm text-emerald-800">High-visibility preparation board with actionable statuses.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.slice(0, 3).map((order) => <OrderCard key={order.id} order={order} />)
          ) : (
            <EmptyState title="No live orders yet" description="Once customers start placing QR orders, recent activity will show here automatically." />
          )}
        </div>
      </section>
    </div>
  );
}
