import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@lib/supabase';

export type Role = 'regular' | 'valued' | 'admin' | 'superadmin';

export const getHomePath = (role?: Role) => {
  switch (role) {
    case 'valued':
      return '/valued';
    case 'admin':
      return '/admin';
    case 'superadmin':
      return '/superadmin';
    case 'regular':
    default:
      return '/customer';
  }
};

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: Role | undefined;
};

type AuthContextValue = AuthState & {
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  loading: true,
  session: null,
  user: null,
  role: undefined,
  refresh: async () => {},
});

async function fetchRoleForUser(user: User | null): Promise<Role | undefined> {
  if (!user?.id) return undefined;
  try {
    const { data } = await supabase
      .from('customer')
      .select('customer_type')
      .eq('customer_id', user.id)
      .maybeSingle();
    const dbRole = (data?.customer_type as Role | undefined) || undefined;
    const metaRole =
      (user.user_metadata?.role as Role | undefined) || undefined;
    return (dbRole || metaRole || 'regular') as Role;
  } catch {
    const metaRole =
      (user.user_metadata?.role as Role | undefined) || undefined;
    return (metaRole || 'regular') as Role;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
    role: undefined,
  });

  useEffect(() => {
    let mounted = true;

    const primeFromStorage = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        if (stored?.role) {
          setState(s => ({ ...s, role: stored.role as Role }));
        }
      } catch {
        // ignore
      }
    };

    primeFromStorage();

    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data: userData } = await supabase.auth.getUser();
      const session = sessionData.session ?? null;
      const user = userData.user ?? null;
      const role = await fetchRoleForUser(user);
      if (mounted) setState({ loading: false, session, user, role });
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setState(s => ({ ...s, loading: true }));
        (async () => {
          const user = session?.user ?? null;
          const role = await fetchRoleForUser(user);
          if (mounted)
            setState({ loading: false, session: session ?? null, user, role });
        })();
      }
    );

    return () => {
      mounted = false;
      // Supabase v2
      listener.subscription.unsubscribe();
    };
  }, []);

  const refresh = async () => {
    setState(s => ({ ...s, loading: true }));
    const { data: sessionData } = await supabase.auth.getSession();
    const { data: userData } = await supabase.auth.getUser();
    const session = sessionData.session ?? null;
    const user = userData.user ?? null;
    const role = await fetchRoleForUser(user);
    setState({ loading: false, session, user, role });
  };

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, refresh }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
