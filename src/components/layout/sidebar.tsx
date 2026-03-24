import type { ReactNode } from 'react';
import { BarChart3, CookingPot, LayoutGrid, LogOut, QrCode, ReceiptText, Settings2, SquareMenu, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/use-auth';
import { useBusinessSettings } from '../../hooks/use-dashboard-queries';
import { defaultBusinessSettings } from '../../lib/constants/business';
import { adminNavigation, kitchenNavigation } from '../../lib/constants/routes';
import { cn } from '../../lib/utils/cn';

interface SidebarProps {
  area: 'admin' | 'kitchen';
}

const iconMap: Record<string, ReactNode> = {
  Dashboard: <LayoutGrid className="h-4 w-4" />,
  Orders: <ReceiptText className="h-4 w-4" />,
  Sales: <BarChart3 className="h-4 w-4" />,
  Categories: <SquareMenu className="h-4 w-4" />,
  'Menu Items': <SquareMenu className="h-4 w-4" />,
  Tables: <QrCode className="h-4 w-4" />,
  Analytics: <BarChart3 className="h-4 w-4" />,
  Settings: <Settings2 className="h-4 w-4" />,
  Staff: <Users className="h-4 w-4" />,
  'Kitchen Board': <CookingPot className="h-4 w-4" />,
};

export function Sidebar({ area }: SidebarProps) {
  const { signOut, profile } = useAuth();
  const { data: settings } = useBusinessSettings();
  const business = settings || defaultBusinessSettings;
  const navigationSource = area === 'admin' ? adminNavigation : kitchenNavigation;
  const navigation = navigationSource.filter((item) => !item.roles || item.roles.includes(profile?.role ?? 'waiter'));

  return (
    <aside className="glass-panel flex flex-col justify-between p-5">
      <div className="space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700">Single Store Deploy</p>
          <div className="mt-3 flex items-center gap-3">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.businessName} className="h-12 w-12 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-lg font-semibold text-amber-900">
                {business.businessName.slice(0, 1)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{business.businessName}</h1>
              <p className="text-sm text-slate-500">{business.currency} menu pricing</p>
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            One deployment, one restaurant, and a role-aware workspace for service, kitchen, and management.
          </p>
          {profile ? <p className="mt-3 text-sm text-slate-500">Signed in as {profile.fullName}</p> : null}
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                  isActive ? 'bg-amber-700 text-white shadow-lg' : 'bg-white/70 text-slate-700 hover:bg-white',
                )
              }
            >
              {iconMap[item.label]}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <button
        className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500"
        onClick={() => {
          void signOut();
        }}
        type="button"
      >
        <LogOut className="h-4 w-4" />
        Staff sign out
      </button>
    </aside>
  );
}
