import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/auth/AuthContext';
import { getHomePath } from '../../../hooks/auth/AuthContext';

export const GuestOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, session, role } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to={getHomePath(role)} replace />;
  return <>{children}</>;
};

export default GuestOnly;


