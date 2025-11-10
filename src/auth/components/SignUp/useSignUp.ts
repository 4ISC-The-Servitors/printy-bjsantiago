import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  getFirstNameValidationMessage,
  getLastNameValidationMessage,
  getPhoneValidationMessage,
  getBirthdayValidationMessage,
  getZipValidationMessage,
  getStreetValidationMessage,
  getBarangayValidationMessage,
  getBuildingNumberValidationMessage,
  formatNameInput,
  formatPasswordInput,
  formatZipCodeInput,
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

  // Ref to track if submission was explicitly requested via button click
  // This prevents auto-submission from form events, navigation, or other triggers
  const explicitSubmitRequested = useRef(false);

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
      } else if (field === 'password' || field === 'confirmPassword') {
        // Remove spaces from password fields
        formattedValue = formatPasswordInput(value as string);
      } else if (field === 'zipCode') {
        // Format ZIP code to numbers only, max 4 digits
        formattedValue = formatZipCodeInput(value as string);
      } else if (
        field === 'street' ||
        field === 'barangay' ||
        field === 'buildingNumber'
      ) {
        // Limit address fields to 100 characters
        // Remove invalid characters (keep letters, numbers, spaces, and common address chars)
        let cleaned = (value as string).replace(
          /[^A-Za-z0-9À-ÿ\u00C0-\u017F\s\-.,#]/g,
          ''
        );
        cleaned = cleaned.slice(0, 100);
        formattedValue = cleaned;
      }

      setFormData(prev => ({ ...prev, [field]: formattedValue }));

      let message = '';
      switch (field) {
        case 'email':
          message = getEmailValidationMessage(value as string);
          // If there was a duplicate error and user changed email, clear it
          // (normal validation will show format errors if needed)
          break;
        case 'password':
          message = getPasswordValidationMessage(formattedValue as string);
          break;
        case 'confirmPassword':
          message =
            (formattedValue as string) !== formData.password
              ? 'Passwords do not match.'
              : '';
          break;
        case 'firstName':
          message = getFirstNameValidationMessage(formattedValue as string);
          break;
        case 'lastName':
          message = getLastNameValidationMessage(formattedValue as string);
          break;
        case 'phone':
          message = getPhoneValidationMessage(formattedValue as string);
          // If there was a duplicate error and user changed phone, clear it
          // (normal validation will show format errors if needed)
          break;
        case 'birthday':
          message = getBirthdayValidationMessage(value as string);
          break;
        case 'zipCode':
          message = getZipValidationMessage(formattedValue as string);
          break;
        case 'street':
          message = getStreetValidationMessage(formattedValue as string);
          break;
        case 'barangay':
          message = getBarangayValidationMessage(formattedValue as string);
          break;
        case 'buildingNumber':
          message = getBuildingNumberValidationMessage(
            formattedValue as string
          );
          break;
        default:
          message = '';
      }

      setErrors(prev => {
        // If user is modifying a field that had a duplicate error, clear it
        // This allows users to try a different email/phone after getting duplicate error
        const newErrors = { ...prev };

        // Clear duplicate errors when user modifies the field
        if (
          field === 'email' &&
          prev.email &&
          prev.email.includes('already registered')
        ) {
          // User is trying a different email - clear duplicate error if format is valid
          if (!message) {
            delete newErrors.email;
            return newErrors;
          }
        }

        if (
          field === 'phone' &&
          prev.phone &&
          prev.phone.includes('already registered')
        ) {
          // User is trying a different phone - clear duplicate error if format is valid
          if (!message) {
            delete newErrors.phone;
            return newErrors;
          }
        }

        // Set the validation message (will overwrite duplicate error if format is invalid)
        return { ...newErrors, [field]: message };
      });
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
              buildingNumber: formData.buildingNumber,
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

  // Handle explicit button click submission
  const handleExplicitSubmit = useCallback(async () => {
    // Only allow submission when on step 3
    if (currentStep !== 3) {
      return;
    }

    // Prevent submission if already loading
    if (loading) {
      return;
    }

    // Mark that submission was explicitly requested
    explicitSubmitRequested.current = true;
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

      // Normalize phone number and ensure it's in the correct format
      let normalizedPhone = normalizePhone(formData.phone);
      // Ensure phone is trimmed and in correct format (+639XXXXXXXXX)
      normalizedPhone = normalizedPhone.trim();

      if (!isValidPhone(normalizedPhone)) {
        toast.error(
          'Invalid Mobile Number',
          'Enter a valid PH mobile number (+639XXXXXXXXX).'
        );
        setLoading(false);
        return;
      }

      // Validate phone format matches database format
      // Database stores: +639XXXXXXXXX (exactly 13 characters)
      if (
        normalizedPhone.length !== 13 ||
        !normalizedPhone.startsWith('+639')
      ) {
        toast.error(
          'Invalid Mobile Number',
          'Phone number format is invalid. Please check your input.'
        );
        setLoading(false);
        return;
      }

      // Validate and normalize email
      const normalizedEmail = formData.email.trim().toLowerCase();
      if (!normalizedEmail) {
        toast.error('Validation Error', 'Email is required.');
        setLoading(false);
        return;
      }

      // Check for existing email in customer table (case-insensitive)
      // Use ilike for case-insensitive comparison
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from('customer')
        .select('customer_id, email_address')
        .not('email_address', 'is', null)
        .neq('email_address', '')
        .ilike('email_address', normalizedEmail)
        .maybeSingle();

      if (emailCheckError) {
        console.error('Error checking email:', emailCheckError);
        toast.error(
          'Validation Error',
          'Unable to verify email. Please try again.'
        );
        setLoading(false);
        return;
      }

      if (existingEmail && existingEmail.email_address) {
        console.log('Duplicate email detected:', {
          existingEmail: existingEmail.email_address,
          normalizedEmail,
          emailInput: formData.email,
        });
        toast.error(
          'Email Already Registered',
          'This email address is already registered. Please sign in or use a different email.'
        );
        setLoading(false);
        // Set error in form state for UI feedback
        setErrors(prev => ({
          ...prev,
          email:
            'This email is already registered. Please use a different email.',
        }));
        return;
      }

      // Check for existing phone number in customer table
      // Phone numbers are stored in normalized format: +639XXXXXXXXX (13 characters)
      const { data: existingPhone, error: phoneCheckError } = await supabase
        .from('customer')
        .select('customer_id, contact_no')
        .not('contact_no', 'is', null)
        .neq('contact_no', '')
        .eq('contact_no', normalizedPhone)
        .maybeSingle();

      if (phoneCheckError) {
        console.error('Error checking phone:', phoneCheckError);
        toast.error(
          'Validation Error',
          'Unable to verify phone number. Please try again.'
        );
        setLoading(false);
        return;
      }

      if (existingPhone && existingPhone.contact_no) {
        toast.error(
          'Mobile Number Already Registered',
          'This mobile number is already registered. Please use a different number.'
        );
        setLoading(false);
        // Set error in form state for UI feedback
        setErrors(prev => ({
          ...prev,
          phone:
            'This mobile number is already registered. Please use a different number.',
        }));
        return;
      }

      // All validations passed, attempt to create account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
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
      });

      // Handle auth errors (including duplicate email in auth.users)
      if (authError) {
        // Check if it's a duplicate email error
        const errorMessage = authError.message.toLowerCase();
        if (
          errorMessage.includes('user already registered') ||
          errorMessage.includes('email already') ||
          errorMessage.includes('already registered') ||
          authError.status === 422
        ) {
          toast.error(
            'Email Already Registered',
            'This email address is already registered. Please sign in or use a different email.'
          );
          setErrors(prev => ({
            ...prev,
            email:
              'This email is already registered. Please use a different email.',
          }));
          setLoading(false);
          return;
        }
        throw authError;
      }

      // Check if user was created (Supabase Auth returns empty identities if email exists)
      const identities = (
        authData.user as unknown as { identities?: unknown[] }
      )?.identities;
      if (Array.isArray(identities) && identities.length === 0) {
        toast.error(
          'Email Already Registered',
          'This email address is already registered. Please sign in or use a different email.'
        );
        setErrors(prev => ({
          ...prev,
          email:
            'This email is already registered. Please use a different email.',
        }));
        setLoading(false);
        return;
      }

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
      explicitSubmitRequested.current = false;
    }
  }, [formData, navigate, toast, currentStep, loading]);

  // Handle form submission event (always prevented - only explicit button click works)
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Form submission via form events is completely disabled
    // Submission only happens via explicit button click (handleExplicitSubmit)
    return;
  }, []);

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
    handleExplicitSubmit,
    handleGoogleSignUp,
  };
};
