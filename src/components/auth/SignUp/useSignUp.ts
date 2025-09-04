import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../lib/useToast';

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  birthday: string;
  buildingNumber: string;
  street: string;
  barangay: string;
  province: string;
  city: string;
  region: string;
  agreeToTerms: boolean;
}

export const useSignUp = () => {
  const navigate = useNavigate();
  const [toasts, toast] = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    gender: '',
    birthday: '',
    buildingNumber: '',
    street: '',
    barangay: '',
    province: '',
    city: '',
    region: 'NCR',
    agreeToTerms: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
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
    (field: keyof SignUpFormData, value: string | boolean) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const isStepValid = useMemo(() => {
    return (step: number) => {
      switch (step) {
        case 1:
          return (
            !!formData.email &&
            !!formData.password &&
            !!formData.confirmPassword &&
            formData.password === formData.confirmPassword &&
            formData.password.length >= 8
          );
        case 2:
          return (
            !!formData.firstName &&
            !!formData.lastName &&
            !!formData.phone &&
            !!formData.gender &&
            !!formData.birthday
          );
        case 3:
          return (
            !!formData.street &&
            !!formData.barangay &&
            !!formData.province &&
            !!formData.city &&
            !!formData.agreeToTerms
          );
        default:
          return false;
      }
    };
  }, [formData]);

  const mapSignUpError = (message?: string) => {
    const msg = (message || '').toLowerCase();
    if (msg.includes('user already') || msg.includes('email already')) {
      return {
        title: 'Email Already Registered',
        body: 'Try signing in or use a different email address.',
      };
    }
    if (msg.includes('password') && msg.includes('short')) {
      return {
        title: 'Weak Password',
        body: 'Password must meet minimum length and complexity.',
      };
    }
    return {
      title: 'Sign Up Failed',
      body:
        message ||
        'There was an issue creating your account. Please try again.',
    };
  };

  const normalizePhone = (raw: string) => {
    let v = raw.trim();
    if (!v) return '';
    if (!v.startsWith('+63'))
      v = '+63' + v.replace(/^\+?63/, '').replace(/^0+/, '');
    v = '+63' + v.slice(3).replace(/\D/g, '');
    return v;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      try {
        if (formData.password !== formData.confirmPassword) {
          toast.error(
            'Passwords do not match',
            'Please confirm your password.'
          );
          setLoading(false);
          return;
        }
        const normalizedPhone = normalizePhone(formData.phone);
        if (!/^\+639\d{9}$/.test(normalizedPhone)) {
          toast.error(
            'Invalid Mobile Number',
            'Enter a valid PH mobile number (+639XXXXXXXXX).'
          );
          setLoading(false);
          return;
        }
        try {
          const { data: existingPhone } = await supabase
            .from('customer')
            .select('customer_id')
            .eq('contact_no', normalizedPhone)
            .maybeSingle();
          if (existingPhone) {
            toast.error(
              'Mobile Number In Use',
              'This mobile number is already registered. Use a different number.'
            );
            setLoading(false);
            return;
          }
        } catch {
          // ignore, backend will enforce as well
        }
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: formData.email,
            password: formData.password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/signin`,
              data: {
                first_name: formData.firstName || null,
                last_name: formData.lastName || null,
                phone: normalizedPhone || null,
                address: {
                  region: formData.region || null,
                  province: formData.province || null,
                  city: formData.city || null,
                  zip_code: null,
                  barangay: formData.barangay || null,
                  street: formData.street || null,
                  building_number: formData.buildingNumber || null,
                  building_name: null,
                },
              },
            },
          }
        );
        if (authError) throw authError;
        const identities = (
          authData.user as unknown as { identities?: unknown[] }
        )?.identities;
        if (Array.isArray(identities) && identities.length === 0)
          throw new Error('Email already registered');
        if (authData.session) {
          try {
            await supabase.rpc('upsert_full_address', {
              p_region: formData.region || null,
              p_province: formData.province || null,
              p_city: formData.city || null,
              p_zip_code: null,
              p_barangay: formData.barangay || null,
              p_street: formData.street || null,
              p_building_number: formData.buildingNumber || null,
              p_building_name: null,
            });
          } catch (e) {
            console.warn('Address upsert skipped:', e);
          }
        }
        toast.show({
          title: 'Check your email',
          message:
            'We sent a confirmation link to your email to verify your account.',
          variant: 'success',
          duration: 6000,
        });
        setTimeout(
          () => navigate('/auth/signin'),
          authData.session ? 3000 : 1000
        );
      } catch (error: unknown) {
        const mapped = mapSignUpError(
          error instanceof Error ? error.message : undefined
        );
        toast.error(mapped.title, mapped.body);
      } finally {
        setLoading(false);
      }
    },
    [formData, navigate, toast]
  );

  const handleGoogleSignUp = useCallback(async () => {
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
        'Google Sign-Up Failed',
        'There was an issue signing up with Google.'
      );
    } finally {
      setGoogleLoading(false);
    }
  }, [toast]);

  return {
    toasts,
    toast,
    currentStep,
    setCurrentStep,
    loading,
    googleLoading,
    isDesktop,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    formData,
    setField,
    isStepValid,
    handleSubmit,
    handleGoogleSignUp,
  };
};
