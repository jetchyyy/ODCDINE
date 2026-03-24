import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../../components/layout/app-layout';
import { ProtectedRoute } from '../../features/auth/protected-route';
import { ADMIN_ONLY_ROLES, ORDER_MANAGEMENT_ROLES, SALES_PORTAL_ROLES, STAFF_PORTAL_ROLES } from '../../lib/constants/app';
import { AdminAnalyticsPage } from '../../pages/admin/analytics-page';
import { AdminCategoryPage } from '../../pages/admin/category-page';
import { AdminDashboardPage } from '../../pages/admin/dashboard-page';
import { AdminItemsPage } from '../../pages/admin/items-page';
import { AdminOrderDetailsPage } from '../../pages/admin/order-details-page';
import { AdminOrdersPage } from '../../pages/admin/orders-page';
import { AdminSalesPage } from '../../pages/admin/sales-page';
import { AdminSettingsPage } from '../../pages/admin/settings-page';
import { AdminStaffPage } from '../../pages/admin/staff-page';
import { AdminTablesPage } from '../../pages/admin/tables-page';
import { LoginPage } from '../../pages/auth/login-page';
import { KitchenOrdersPage } from '../../pages/kitchen/orders-page';
import { CartPage } from '../../pages/public/cart-page';
import { MenuPage } from '../../pages/public/menu-page';
import { TrackOrderPage } from '../../pages/public/track-order-page';

function withRoles(element: React.ReactNode, allowedRoles: typeof STAFF_PORTAL_ROLES) {
  return <ProtectedRoute allowedRoles={allowedRoles}>{element}</ProtectedRoute>;
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/admin/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/t/:tableCode', element: <MenuPage /> },
  { path: '/menu/:tableCode', element: <MenuPage /> },
  { path: '/cart/:tableCode', element: <CartPage /> },
  { path: '/track/:orderId', element: <TrackOrderPage /> },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={STAFF_PORTAL_ROLES}>
        <AppLayout area="admin" />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'orders', element: withRoles(<AdminOrdersPage />, ORDER_MANAGEMENT_ROLES) },
      { path: 'orders/:id', element: withRoles(<AdminOrderDetailsPage />, ORDER_MANAGEMENT_ROLES) },
      { path: 'sales', element: withRoles(<AdminSalesPage />, SALES_PORTAL_ROLES) },
      { path: 'menu/categories', element: withRoles(<AdminCategoryPage />, ADMIN_ONLY_ROLES) },
      { path: 'menu/items', element: withRoles(<AdminItemsPage />, ADMIN_ONLY_ROLES) },
      { path: 'tables', element: withRoles(<AdminTablesPage />, ADMIN_ONLY_ROLES) },
      { path: 'analytics', element: withRoles(<AdminAnalyticsPage />, ADMIN_ONLY_ROLES) },
      { path: 'settings', element: withRoles(<AdminSettingsPage />, ADMIN_ONLY_ROLES) },
      { path: 'staff', element: withRoles(<AdminStaffPage />, ADMIN_ONLY_ROLES) },
    ],
  },
  {
    path: '/kitchen',
    element: (
      <ProtectedRoute allowedRoles={ORDER_MANAGEMENT_ROLES}>
        <AppLayout area="kitchen" />
      </ProtectedRoute>
    ),
    children: [{ path: 'orders', element: <KitchenOrdersPage /> }],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
