import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Wraps admin-only routes. Redirects to /admin/login if the user is not
 * authenticated or does not have the admin custom claim.
 */
export default function AdminGuard({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
