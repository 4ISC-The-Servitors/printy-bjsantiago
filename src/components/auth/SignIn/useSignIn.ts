import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../lib/useToast';
import { assertHumanTurnstile, primeTurnstile } from '../../../lib/turnstile';

export interface SignInFormData {
  email: string;
  password: string;
  keepLoggedIn: boolean;
}

export const useSignIn = () => {
  const navigate = useNavigate();
  const [toasts, toast] = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
    keepLoggedIn: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Warm-up Turnstile token in the background for snappier submit
    primeTurnstile('signin');
    const mql = window.matchMedia('(min-width: 1024px)');
    const modern = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    const legacy = function (this: MediaQueryList, e: MediaQueryListEvent) {
      setIsDesktop(e.matches);
    };
    setIsDesktop(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', modern);
    else (mql as MediaQueryList).addListener(legacy);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', modern);
      else (mql as MediaQueryList).removeListener(legacy);
    };
  }, []);

  const setField = useCallback(
    (field: keyof SignInFormData, value: string | boolean) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        await assertHumanTurnstile('signin');
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        const user = data.user;
        const userId = user?.id;
        let destination = '/customer';
        let customerType: string | undefined;
        if (userId) {
          const { data: byId, error: getErr } = await supabase
            .from('customer')
            .select('customer_type')
            .eq('customer_id', userId)
            .maybeSingle();
          if (getErr) throw getErr;
          let customerById = byId as { customer_type?: string } | null;
          if (!customerById) {
            const m = (user?.user_metadata ?? {}) as Record<string, unknown>;
            const addr = (m.address ?? {}) as Record<string, unknown>;
            const hasAddr = Boolean(
              typeof addr.region === 'string' &&
                typeof addr.province === 'string' &&
                typeof addr.city === 'string' &&
                typeof addr.barangay === 'string' &&
                typeof addr.street === 'string'
            );
            let locationId: string | null = null;
            if (hasAddr) {
              try {
                const { data: rpcData, error: rpcError } = await supabase.rpc(
                  'upsert_full_address',
                  {
                    p_region: (addr.region as string) || null,
                    p_province: (addr.province as string) || null,
                    p_city: (addr.city as string) || null,
                    p_zip_code: ((addr as { zip_code?: string; zip?: string })
                      .zip_code ||
                      (addr as { zip?: string }).zip ||
                      null) as string | null,
                    p_barangay: (addr.barangay as string) || null,
                    p_street: (addr.street as string) || null,
                    p_building_number: (addr.building_number as string) || null,
                    p_building_name: (addr.building_name as string) || null,
                  }
                );
                if (rpcError) throw rpcError;
                locationId = (rpcData as string | null) ?? null;
                if (!locationId) throw new Error('No location_id returned');
              } catch (rpcError: unknown) {
                const { data: locData, error: locError } = await supabase.rpc(
                  'upsert_location_from_meta',
                  {
                    p_region: (addr.region as string) || null,
                    p_province: (addr.province as string) || null,
                    p_city: (addr.city as string) || null,
                    p_zip_code: ((addr as { zip_code?: string; zip?: string })
                      .zip_code ||
                      (addr as { zip?: string }).zip ||
                      null) as string | null,
                    p_barangay: (addr.barangay as string) || null,
                    p_street: (addr.street as string) || null,
                    p_building_number: (addr.building_number as string) || null,
                    p_building_name: (addr.building_name as string) || null,
                  }
                );
                if (locError) throw locError;
                locationId = (locData as string | null) ?? null;
              }
            }
            if (locationId) {
              const insertRes = await supabase.from('customer').insert({
                customer_id: userId,
                first_name: (
                  (user?.user_metadata ?? {}) as Record<string, unknown>
                ).first_name as string | null,
                last_name: (
                  (user?.user_metadata ?? {}) as Record<string, unknown>
                ).last_name as string | null,
                contact_no: (
                  (user?.user_metadata ?? {}) as Record<string, unknown>
                ).phone as string | null,
                email_address: user?.email || null,
                customer_type:
                  (((user?.user_metadata ?? {}) as Record<string, unknown>)
                    .role as string) || 'regular',
                location_id: locationId,
              });
              if (insertRes.error) throw insertRes.error;
            }
            customerById = {
              customer_type:
                (((user?.user_metadata ?? {}) as Record<string, unknown>)
                  .role as string) || 'regular',
            } as {
              customer_type: string;
            };
          }
          customerType = customerById?.customer_type;
        }
        if (!customerType && user?.email) {
          const { data: byEmail } = await supabase
            .from('customer')
            .select('customer_type')
            .eq('email_address', user.email)
            .maybeSingle();
          customerType = (byEmail?.customer_type as string) || undefined;
        }
        const routeMap: Record<string, string> = {
          regular: '/customer',
          customer: '/customer',
          valued: '/valued',
          admin: '/admin',
          superadmin: '/superadmin',
        };
        destination =
          customerType && routeMap[customerType]
            ? routeMap[customerType]
            : '/customer';
        // Persist minimal user info for later flows (e.g., Place Order)
        try {
          const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
          const storedUser = {
            ...existingUser,
            customer_id: userId ?? existingUser?.customer_id,
            email: user?.email ?? existingUser?.email,
            role: customerType ?? existingUser?.role,
          };
          localStorage.setItem('user', JSON.stringify(storedUser));
        } catch {
          // ignore storage errors
        }

        toast.success('Welcome back!', 'Successfully signed in');
        setTimeout(() => navigate(destination), 1000);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Please check your credentials and try again.';
        toast.error('Sign In Failed', message);
      } finally {
        setLoading(false);
      }
    },
    [formData, navigate, toast]
  );

  const handleGoogleSignIn = useCallback(async () => {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/customer`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error(
        'Google Sign-In Failed',
        'There was an issue signing in with Google.'
      );
    } finally {
      setGoogleLoading(false);
    }
  }, [toast]);

  return {
    toasts,
    toast,
    formData,
    setField,
    showPassword,
    setShowPassword,
    loading,
    googleLoading,
    isDesktop,
    handleSubmit,
    handleGoogleSignIn,
  };
};
