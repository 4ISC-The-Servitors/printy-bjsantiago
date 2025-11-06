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
  const [dbRole, setDbRole] = React.useState<Role | undefined>(undefined);
  React.useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setHasSession(Boolean(data.session));
      const { data: userData } = await supabase.auth.getUser();
      const mr =
        (((userData?.user?.app_metadata as any)?.role as Role | undefined) ||
          (userData?.user?.user_metadata?.role as Role | undefined) ||
          undefined) as Role | undefined;
      if (active) setMetaRole(mr);
      // If we have a session but no role info yet, try a quick DB lookup
      if (active && data.session && !mr) {
        const uid = userData?.user?.id;
        if (uid) {
          try {
            const { data: row } = await supabase
              .from('customer')
              .select('customer_type')
              .eq('customer_id', uid)
              .maybeSingle();
            const r = (row?.customer_type as Role | undefined) || undefined;
            if (active) setDbRole(r);
          } catch {
            /* ignore */
          }
        }
      }
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

  if (session || hasSession) {
    const resolvedRole = role ?? metaRole ?? dbRole;
    if (resolvedRole) {
      return <Navigate to={getHomePath(resolvedRole)} replace />;
    }
    // Role unknown yet: avoid misrouting to /customer by waiting briefly
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="text-neutral-500">Loading…</span>
      </div>
    );
  }
  return <>{children}</>;
};

export default GuestOnly;
