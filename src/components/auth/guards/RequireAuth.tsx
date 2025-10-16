import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/auth/AuthContext';
import { getHomePath, type Role } from '../../../hooks/auth/AuthContext';

export const RequireAuth: React.FC<{ allowed: Role[]; children: React.ReactNode }> = ({ allowed, children }) => {
  const { loading, session, role } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!session) return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  if (!role || !allowed.includes(role)) return <Navigate to={getHomePath(role)} replace />;
  return <>{children}</>;
};

export default RequireAuth;


