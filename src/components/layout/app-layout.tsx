import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface AppLayoutProps {
  area: 'admin' | 'kitchen';
}

export function AppLayout({ area }: AppLayoutProps) {
  return (
    <div className="page-shell p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[280px_1fr]">
        <Sidebar area={area} />
        <main className="glass-panel overflow-hidden">
          <Header area={area} />
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
