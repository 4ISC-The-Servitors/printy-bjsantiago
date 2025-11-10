import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, SITE_URL } from '@lib/supabase';
import { useToast } from '@lib/useToast';

// Import validation + formatting helpers (fixed import path)
import {
  normalizePhone,
  validateStep1,
  validateStep2,
  validateStep3,
  isValidPhone,
  getEmailValidationMessage,
  getPasswordValidationMessage,
  getNameValidationMessage,
  getPhoneValidationMessage,
  getBirthdayValidationMessage,
  getZipValidationMessage,
  formatNameInput,
} from '@/shared/utils/formsFormatter';

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
  zipCode: string;
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
    region: '',
    zipCode: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Detect desktop view
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

  // Real-time field update + validation
  const setField = useCallback(
    (field: keyof SignUpFormData, value: string | boolean) => {
      let formattedValue = value;

      // Apply formatting before validation
      if (field === 'firstName' || field === 'lastName') {
        formattedValue = formatNameInput(value as string);
      } else if (field === 'phone') {
        formattedValue = normalizePhone(value as string);
      }

      setFormData(prev => ({ ...prev, [field]: formattedValue }));

      let message = '';
      switch (field) {
        case 'email':
          message = getEmailValidationMessage(value as string);
          break;
        case 'password':
          message = getPasswordValidationMessage(value as string);
          break;
        case 'confirmPassword':
          message =
            (value as string) !== formData.password
              ? 'Passwords do not match.'
              : '';
          break;
        case 'firstName':
        case 'lastName':
          message = getNameValidationMessage(value as string);
          break;
        case 'phone':
          message = getPhoneValidationMessage(value as string);
          break;
        case 'birthday':
          message = getBirthdayValidationMessage(value as string);
          break;
        case 'zipCode':
          message = getZipValidationMessage(value as string);
          break;
        default:
          message = '';
      }

      setErrors(prev => ({ ...prev, [field]: message }));
    },
    [formData.password]
  );

  // Step validation
  const isStepValid = useMemo(() => {
    return (step: number) => {
      switch (step) {
        case 1:
          return (
            validateStep1({
              email: formData.email,
              password: formData.password,
              confirmPassword: formData.confirmPassword,
            }) === ''
          );
        case 2:
          return (
            validateStep2({
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              gender: formData.gender,
              birthday: formData.birthday,
            }) === ''
          );
        case 3:
          return (
            validateStep3({
              street: formData.street,
              barangay: formData.barangay,
              province: formData.province,
              city: formData.city,
              region: formData.region,
              zipCode: formData.zipCode,
              agreeToTerms: formData.agreeToTerms,
            }) === ''
          );
        default:
          return false;
      }
    };
  }, [formData]);

  // Error mapping
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

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      try {
        const step1Error = validateStep1({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
        if (step1Error) {
          toast.error('Validation Error', step1Error);
          setLoading(false);
          return;
        }

        const step2Error = validateStep2({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          gender: formData.gender,
          birthday: formData.birthday,
        });
        if (step2Error) {
          toast.error('Validation Error', step2Error);
          setLoading(false);
          return;
        }

        const normalizedPhone = normalizePhone(formData.phone);
        if (!isValidPhone(normalizedPhone)) {
          toast.error(
            'Invalid Mobile Number',
            'Enter a valid PH mobile number (+639XXXXXXXXX).'
          );
          setLoading(false);
          return;
        }

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

        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: formData.email,
            password: formData.password,
            options: {
              emailRedirectTo: `${SITE_URL}/auth/confirm`,
              data: {
                first_name: formData.firstName || null,
                last_name: formData.lastName || null,
                phone: normalizedPhone || null,
                gender: formData.gender || null,
                birthday: formData.birthday || null,
                address: {
                  region: formData.region || null,
                  province: formData.province || null,
                  city: formData.city || null,
                  zip_code: formData.zipCode || null,
                  barangay: formData.barangay || null,
                  street: formData.street || null,
                  building_name: formData.buildingNumber || null,
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

        if (authData.user && authData.session) {
          try {
            let locationId: string | null = null;
            if (
              formData.region &&
              formData.province &&
              formData.city &&
              formData.barangay &&
              formData.street
            ) {
              const locationResult = await supabase.rpc('upsert_full_address', {
                p_region: formData.region || null,
                p_province: formData.province || null,
                p_city: formData.city || null,
                p_zip_code: formData.zipCode || null,
                p_barangay: formData.barangay || null,
                p_street: formData.street || null,
                p_building_number: null,
                p_building_name: formData.buildingNumber || null,
              });

              if (locationResult.data) {
                locationId = locationResult.data;
              }
            }

            const { error: customerError } = await supabase
              .from('customer')
              .upsert(
                {
                  customer_id: authData.user.id,
                  first_name: formData.firstName || null,
                  last_name: formData.lastName || null,
                  contact_no: normalizedPhone || null,
                  email_address: formData.email,
                  customer_type: 'regular',
                  gender: formData.gender || null,
                  birthday: formData.birthday || null,
                  location_id: locationId,
                },
                { onConflict: 'customer_id', ignoreDuplicates: false }
              );

            if (customerError) {
              console.error('Error upserting customer record:', customerError);
            }
          } catch (e) {
            // Customer creation skipped
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
          redirectTo: `${SITE_URL}/customer`,
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
    errors,
    setField,
    isStepValid,
    handleSubmit,
    handleGoogleSignUp,
  };
};
