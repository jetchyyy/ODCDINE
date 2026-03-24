import { Outlet, useLocation } from 'react-router-dom';
import { NewOrderAlertModal } from '../orders/new-order-alert-modal';
import { useAuth } from '../../features/auth/use-auth';
import { useUpdateOrderStatus } from '../../hooks/use-dashboard-queries';
import { useNewOrderAlerts } from '../../hooks/use-new-order-alerts';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface AppLayoutProps {
  area: 'admin' | 'kitchen';
}

export function AppLayout({ area }: AppLayoutProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const { activeOrder, speechEnabled, dismissAlert, toggleSpeech } = useNewOrderAlerts(profile?.role);
  const updateOrderStatusMutation = useUpdateOrderStatus();

  async function handleConfirmOrder(orderId: string) {
    await updateOrderStatusMutation.mutateAsync({ orderId, status: 'confirmed' });
    dismissAlert();
  }

  return (
    <>
      <div className="page-shell p-4 md:p-6">
        <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[280px_1fr]">
          <Sidebar area={area} />
          <main className="glass-panel overflow-hidden">
            <Header area={area} speechEnabled={speechEnabled} onToggleSpeech={toggleSpeech} />
            <div key={location.pathname} className="p-4 md:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <NewOrderAlertModal
        area={area}
        order={activeOrder}
        onClose={dismissAlert}
        onConfirm={(orderId) => {
          void handleConfirmOrder(orderId);
        }}
        confirmPending={updateOrderStatusMutation.isPending}
      />
    </>
  );
}
