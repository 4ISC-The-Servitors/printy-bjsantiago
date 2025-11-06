import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/hooks/AuthContext';
import { getHomePath, type Role } from '@/auth/hooks/AuthContext';
import { supabase } from '@lib/supabase';

export const GuestOnly: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { /* loading, */ session, role } = useAuth();

  // Local fast-path: check Supabase session directly so we can redirect
  // immediately without waiting for AuthContext role fetch.
  const [hasSession, setHasSession] = React.useState<boolean | null>(null);
  const [metaRole, setMetaRole] = React.useState<Role | undefined>(undefined);
  React.useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setHasSession(Boolean(data.session));
      const { data: userData } = await supabase.auth.getUser();
      const mr = (userData?.user?.user_metadata?.role as Role | undefined) || undefined;
      if (active) setMetaRole(mr);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (!active) return;
      setHasSession(Boolean(s));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (session || hasSession)
    return <Navigate to={getHomePath(role ?? metaRole)} replace />;
  return <>{children}</>;
};

export default GuestOnly;
