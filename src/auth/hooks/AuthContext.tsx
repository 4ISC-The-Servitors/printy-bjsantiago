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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ROLE_FETCH_TIMEOUT_MS = 3000;

function getLoginAt(): number | undefined {
  try {
    const raw = localStorage.getItem('loginAt');
    if (!raw) return undefined;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function setLoginAt(timestamp: number = Date.now()) {
  try {
    localStorage.setItem('loginAt', String(timestamp));
  } catch {
    // ignore
  }
}

function clearLoginAt() {
  try {
    localStorage.removeItem('loginAt');
  } catch {
    // ignore
  }
}

function getMetaRole(user: User | null): Role | undefined {
  if (!user) return undefined;
  const app = (user.app_metadata as any) || {};
  const fromApp = (app.role as Role | undefined) ||
    (Array.isArray(app.roles) ? (app.roles[0] as Role | undefined) : undefined) ||
    ((app.claims?.role as Role | undefined) ?? undefined);
  const fromUser = (user.user_metadata as any)?.role as Role | undefined;
  return (fromApp || fromUser) as Role | undefined;
}

async function fetchRoleForUser(user: User | null): Promise<Role | undefined> {
  if (!user?.id) return undefined;
  try {
    // Prefer metadata role (authoritative for admin/superadmin) over DB
    const metaRole = getMetaRole(user);
    if (metaRole) return metaRole as Role;

    const { data } = await supabase
      .from('customer')
      .select('customer_type')
      .eq('customer_id', user.id)
      .maybeSingle();
    const dbRole = (data?.customer_type as Role | undefined) || undefined;
    return (dbRole || 'regular') as Role;
  } catch {
    const metaRole = getMetaRole(user);
    return (metaRole || 'regular') as Role;
  }
}

async function fetchRoleWithTimeout(user: User | null): Promise<Role | undefined> {
  const metaFallback = getMetaRole(user) || 'regular';
  try {
    return await Promise.race<Promise<Role | undefined>>([
      fetchRoleForUser(user),
      new Promise<Role | undefined>(resolve =>
        setTimeout(() => resolve(metaFallback as Role), ROLE_FETCH_TIMEOUT_MS)
      ),
    ]);
  } catch {
    return metaFallback as Role;
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

    // Do not prime role from localStorage to avoid stale misclassification on refresh.
    // We will resolve role from Supabase session metadata/DB below.

    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data: userData } = await supabase.auth.getUser();
      let session = sessionData.session ?? null;
      let user = userData.user ?? null;

      // Client-side max TTL fallback
      if (session) {
        const loginAt = getLoginAt();
        if (loginAt && Date.now() - loginAt > THIRTY_DAYS_MS) {
          await supabase.auth.signOut();
          clearLoginAt();
          session = null;
          user = null;
        } else if (!loginAt) {
          setLoginAt();
        }
      } else {
        clearLoginAt();
      }

      const role = await fetchRoleWithTimeout(user);
      if (mounted) setState({ loading: false, session, user, role });

      // Ensure we eventually converge to the authoritative DB role
      // even if the timeout returned a metadata fallback first.
      if (session) {
        try {
          const exactRole = await fetchRoleForUser(user);
          if (mounted && exactRole && exactRole !== role) {
            setState(s => ({ ...s, role: exactRole }));
          }
        } catch {
          // ignore
        }
      }
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, nextSession: Session | null) => {
        setState(s => ({ ...s, loading: true }));

        let session: Session | null = nextSession ?? null;
        let user: User | null = session?.user ?? null;

        // Client-side max TTL fallback
        if (session) {
          const loginAt = getLoginAt();
          if (loginAt && Date.now() - loginAt > THIRTY_DAYS_MS) {
            await supabase.auth.signOut();
            clearLoginAt();
            session = null;
            user = null;
          } else if (!loginAt) {
            setLoginAt();
          }
        } else {
          clearLoginAt();
        }

        const role = await fetchRoleWithTimeout(user);
        if (mounted)
          setState({ loading: false, session: session ?? null, user, role });

        // Converge to exact DB role
        if (session) {
          try {
            const exactRole = await fetchRoleForUser(user);
            if (mounted && exactRole && exactRole !== role) {
              setState(s => ({ ...s, role: exactRole }));
            }
          } catch {
            // ignore
          }
        }
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
    const role = await fetchRoleWithTimeout(user);
    setState({ loading: false, session, user, role });
    if (session) {
      try {
        const exactRole = await fetchRoleForUser(user);
        if (exactRole && exactRole !== role) {
          setState(s => ({ ...s, role: exactRole }));
        }
      } catch {}
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, refresh }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
