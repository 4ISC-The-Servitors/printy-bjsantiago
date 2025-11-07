import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/hooks/AuthContext';
import { getHomePath, type Role } from '@/auth/hooks/AuthContext';
import { supabase } from '@lib/supabase';

export const RequireAuth: React.FC<{
  allowed: Role[];
  children: React.ReactNode;
}> = ({ allowed, children }) => {
  const { loading, session, role } = useAuth();
  const location = useLocation();

  // Fast-path: detect session directly to avoid prolonged blank screen
  const [hasSession, setHasSession] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setHasSession(Boolean(data.session));
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

  // While loading, show a lightweight placeholder instead of a blank screen
  if (loading) {
    // If we already know there's a session, keep user on page with a minimal loader
    if (hasSession || session) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <span className="text-neutral-500">Loading your dashboard…</span>
        </div>
      );
    }
    // Unknown/no session yet: minimal placeholder
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="text-neutral-500">Checking sign-in…</span>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!session)
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;

  // Redirect to appropriate home page if user doesn't have required role
  if (!role || !allowed.includes(role))
    return <Navigate to={getHomePath(role)} replace />;

  return <>{children}</>;
};

export default RequireAuth;
