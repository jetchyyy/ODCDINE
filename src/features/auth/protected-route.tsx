import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import type { StaffRole } from '../../types/domain';
import { useAuth } from './use-auth';

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles?: StaffRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to={profile.role === 'kitchen' ? '/kitchen/orders' : '/admin/dashboard'} replace />;
  }

  return <>{children}</>;
}
