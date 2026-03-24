import { format } from 'date-fns';
import { Bell, Clock3 } from 'lucide-react';
import { useAuth } from '../../features/auth/use-auth';

interface HeaderProps {
  area: 'admin' | 'kitchen';
}

export function Header({ area }: HeaderProps) {
  const { profile } = useAuth();

  return (
    <header className="flex flex-col gap-4 border-b border-slate-200/80 bg-white/70 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-700">{area}</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          {area === 'admin' ? 'Restaurant Management Console' : 'Kitchen Preparation Board'}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
        {profile ? (
          <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-700">
            {profile.fullName} · {profile.role}
          </div>
        ) : null}
        <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <Clock3 className="h-4 w-4" />
          {format(new Date(), 'EEE, MMM d, yyyy h:mm a')}
        </div>
        <button className="rounded-full bg-slate-900 p-3 text-white" type="button">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
