import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/hooks/AuthContext';
import { getHomePath, type Role } from '@/auth/hooks/AuthContext';

export const RequireAuth: React.FC<{
  allowed: Role[];
  children: React.ReactNode;
}> = ({ allowed, children }) => {
  const { loading, session, role } = useAuth();
  const location = useLocation();

  // Show null while checking authentication - pages have their own loading states
  if (loading) return null;

  // Redirect to signin if not authenticated
  if (!session)
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;

  // Redirect to appropriate home page if user doesn't have required role
  if (!role || !allowed.includes(role))
    return <Navigate to={getHomePath(role)} replace />;

  return <>{children}</>;
};

export default RequireAuth;
