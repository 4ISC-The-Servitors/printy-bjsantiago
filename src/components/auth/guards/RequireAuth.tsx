import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@shared/hooks/auth/AuthContext';
import { getHomePath, type Role } from '@shared/hooks/auth/AuthContext';
import { PageLoading } from '@shared/components';

export const RequireAuth: React.FC<{ allowed: Role[]; children: React.ReactNode }> = ({ allowed, children }) => {
  const { loading, session, role } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication instead of blank screen
  if (loading) return <PageLoading variant="page" />;

  // Redirect to signin if not authenticated
  if (!session) return <Navigate to="/auth/signin" state={{ from: location }} replace />;

  // Redirect to appropriate home page if user doesn't have required role
  if (!role || !allowed.includes(role)) return <Navigate to={getHomePath(role)} replace />;

  return <>{children}</>;
};

export default RequireAuth;


