import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Componente que protege rutas requiriendo autenticación y rol de admin
 * Si el usuario no está autenticado o no es admin, redirige a login
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();

  console.log('[PROTECTED_ROUTE] isAuthenticated:', isAuthenticated);
  console.log('[PROTECTED_ROUTE] isAdmin:', isAdmin);

  // Si no está autenticado, redirige a login
  if (!isAuthenticated) {
    console.warn('[PROTECTED_ROUTE] User not authenticated - redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado pero no es admin, redirige a home
  if (!isAdmin) {
    console.warn('[PROTECTED_ROUTE] User is not admin - redirecting to home');
    return <Navigate to="/" replace />;
  }

  // Si es admin autenticado, muestra el contenido
  console.log('[PROTECTED_ROUTE] User is authenticated admin - granting access');
  return <>{children}</>;
}
