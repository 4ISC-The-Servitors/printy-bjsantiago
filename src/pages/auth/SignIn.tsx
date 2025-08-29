import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Text,
  Container,
  ToastContainer,
} from '../../components/shared';
import { useToast } from '../../lib/useToast';
import { Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// TODO: Backend Integration
// - Replace hardcoded credentials with real Supabase authentication
// - Implement proper JWT token management
// - Add user session persistence
// - Implement role-based routing based on user profile
// - Add proper error handling for authentication failures
// - Implement "Keep me logged in" functionality with refresh tokens

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [toasts, toastMethods] = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    keepLoggedIn: false,
  });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleModern = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    const handleLegacy = function (
      this: MediaQueryList,
      e: MediaQueryListEvent
    ) {
      setIsDesktop(e.matches);
    };
    // Initialize once
    setIsDesktop(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', handleModern);
    else (mql as MediaQueryList).addListener(handleLegacy);
    return () => {
      if (mql.removeEventListener)
        mql.removeEventListener('change', handleModern);
      else (mql as MediaQueryList).removeListener(handleLegacy);
    };
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      const user = data.user;
      const userId = user?.id;

      let destination = '/customer';

      // Fetch the customer row using auth user id or email
      let customerType: string | undefined;
      if (userId) {
        const { data, error: getErr } = await supabase
          .from('customer')
          .select('customer_type')
          .eq('customer_id', userId)
          .maybeSingle();
        let customerById = data;

        if (getErr) throw getErr;

        // Provision missing customer + location on first sign-in
        if (!customerById) {
          const m = (user?.user_metadata ?? {}) as Record<string, unknown>;
          const addr = (m.address ?? {}) as Record<string, unknown>;
          const hasRequiredAddress = Boolean(
            typeof addr.region === 'string' &&
              typeof addr.province === 'string' &&
              typeof addr.city === 'string' &&
              typeof addr.barangay === 'string' &&
              typeof addr.street === 'string'
          );
          // Prefer server-side RPC to insert region/province/city/barangay/street/building/location
          let locationId: string | null = null;
          if (hasRequiredAddress)
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
              if (rpcError) {
                console.warn('RPC upsert_full_address failed:', rpcError);
                throw rpcError;
              }
              // RPC now returns a scalar UUID
              locationId = (rpcData as string | null) ?? null;
              if (!locationId) {
                throw new Error(
                  'No location_id returned from upsert_full_address'
                );
              }
            } catch (rpcError: unknown) {
              console.warn(
                'RPC upsert_full_address failed:',
                rpcError instanceof Error ? rpcError.message : rpcError
              );
              // Try the compatibility wrapper (also returns scalar UUID)
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
          else {
            console.info(
              'Address metadata incomplete; skipping location provisioning'
            );
          }

          // Insert customer only if we have a location_id (to satisfy NOT NULL + FK)
          if (locationId) {
            const insertRes = await supabase.from('customer').insert({
              customer_id: userId,
              first_name: (m.first_name as string) || null,
              last_name: (m.last_name as string) || null,
              contact_no: (m.phone as string) || null,
              email_address: user?.email || null,
              customer_type: (m.role as string) || 'regular',
              location_id: locationId,
            });
            if (insertRes.error) throw insertRes.error;
          } else {
            console.warn(
              'Skipping customer provisioning: unable to generate location_id'
            );
          }

          customerById = { customer_type: (m.role as string) || 'regular' } as {
            customer_type: string;
          };
        }

        customerType = customerById?.customer_type ?? undefined;
      }

      if (!customerType && user?.email) {
        const { data: customerByEmail } = await supabase
          .from('customer')
          .select('customer_type')
          .eq('email_address', user.email)
          .maybeSingle();
        customerType = customerByEmail?.customer_type as string | undefined;
      }

      const routeMap: Record<string, string> = {
        regular: '/customer',
        customer: '/customer',
        valued: '/valued',
        admin: '/admin',
        superadmin: '/superadmin',
      };
      if (customerType && routeMap[customerType]) {
        destination = routeMap[customerType];
      }

      toastMethods.success('Welcome back!', 'Successfully signed in');
      setTimeout(() => navigate(destination), 1000);
    } catch (error: unknown) {
      console.error('Sign in error:', error);
      toastMethods.error(
        'Sign In Failed',
        error instanceof Error
          ? error.message
          : 'Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/customer`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toastMethods.error(
        'Google Sign-In Failed',
        'There was an issue signing in with Google.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex items-center justify-center p-4">
      <Container size="sm" className="w-full container-responsive">
        {/* Back to Home Link */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            threeD
            className="text-neutral-600 hover:text-brand-primary"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Button>
        </div>

        {/* Sign In Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Text
              variant="h1"
              size="4xl"
              weight="bold"
              className="text-neutral-900 mb-2"
            >
              Sign in to your account
            </Text>
            <Text variant="p" size="base" color="muted">
              Don't have an account?{' '}
              <button
                className="text-brand-accent hover:text-brand-accent-700 font-medium transition-colors"
                onClick={() => navigate('/auth/signup')}
              >
                Sign up
              </button>
            </Text>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Input
                label="Email"
                type="email"
                placeholder="you@email.com"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                required
                className="pr-12"
                wrapperClassName="relative"
              >
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Mail className="w-5 h-5" />
                </div>
              </Input>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                required
                className="pr-24"
                wrapperClassName="relative"
              >
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </Input>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.keepLoggedIn}
                  onChange={e =>
                    handleInputChange('keepLoggedIn', e.target.checked)
                  }
                  className="w-4 h-4 text-brand-primary border-neutral-300 rounded focus:ring-brand-primary focus:ring-2"
                />
                <Text variant="span" size="sm" className="text-neutral-700">
                  Keep me logged in
                </Text>
              </label>

              <button
                type="button"
                className="text-error hover:text-error-700 text-sm font-medium transition-colors"
                onClick={() => navigate('/auth/forgot-password')}
              >
                Forgot your password?
              </button>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              threeD
              loading={loading}
              disabled={loading}
              className="w-full btn-responsive-primary"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <Button
            variant="secondary"
            size="lg"
            threeD
            loading={googleLoading}
            disabled={googleLoading || loading}
            className="w-full border border-neutral-300 hover:border-neutral-400"
            onClick={handleGoogleSignIn}
          >
            <div className="w-5 h-5 mr-3">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            {googleLoading
              ? 'Signing in with Google...'
              : 'Sign in with Google'}
          </Button>
        </div>

        {/* Add this button after the existing form, before the closing div */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <Text variant="p" size="sm" color="muted" className="text-center mb-4">
            Prototype Access (Remove before production)
          </Text>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/admin')}
            className="w-full"
          >
             Quick Admin Access
          </Button>
        </div>
      </Container>

      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        onRemoveToast={toastMethods.remove}
        position={isDesktop ? 'bottom-right' : 'top-center'}
      />
    </div>
  );
};

export default SignIn;
