import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { StatCard } from '../../components/ui/stat-card';
import { useAnalytics } from '../../hooks/use-dashboard-queries';
import { formatCurrency } from '../../lib/utils/currency';

export function AdminAnalyticsPage() {
  const { data } = useAnalytics();

  if (!data) {
    return null;
  }

  if (data.totalOrders === 0) {
    return <EmptyState title="No analytics yet" description="Analytics will populate after real orders are created in your Supabase database." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Analytics"
        description="Review revenue, order volume, item performance, cancellations, and hourly demand patterns for this location."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today Sales" value={formatCurrency(data.todaySales)} hint="Gross sales created today." />
        <StatCard label="Weekly Sales" value={formatCurrency(data.weeklySales)} hint="Rolling 7-day revenue." />
        <StatCard label="Monthly Sales" value={formatCurrency(data.monthlySales)} hint="Current calendar month." />
        <StatCard label="Completed Orders" value={String(data.completedOrders)} hint="Orders completed by staff." />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-slate-900">Sales by Day</h3>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#9d5c2f" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-slate-900">Peak Order Hours</h3>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourlyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#2c6e6a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="glass-panel p-5">
        <h3 className="text-lg font-semibold text-slate-900">Best-Selling Items</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {data.topItems.map((item) => (
            <div key={item.name} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{item.name}</p>
              <p className="mt-2 text-sm text-slate-600">{item.quantity} sold</p>
              <p className="mt-1 text-sm text-slate-500">{formatCurrency(item.sales)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
