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
import {
  Eye,
  EyeOff,
  Mail,
  ArrowLeft,
  User,
  Phone,
  MapPin,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

// TODO: Backend Integration
// - Implement real user registration with Supabase Auth
// - Create user profile in database after successful auth
// - Add proper validation and error handling
// - Implement email verification flow
// - Add phone number validation and verification
// - Store address information in user profile
// - Implement terms of service and privacy policy acceptance
// - Add Google OAuth registration option

interface FormData {
  // Step 1: Account Information
  email: string;
  password: string;
  confirmPassword: string;

  // Step 2: Personal Information
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  birthday: string;

  // Step 3: Address Information
  buildingNumber: string;
  street: string;
  barangay: string;
  province: string;
  city: string;
  region: string;
  

  // Common
  agreeToTerms: boolean;
}

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [toasts, toastMethods] = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop('matches' in e ? e.matches : (e as MediaQueryList).matches);
    };
    handler(mql);
    if (mql.addEventListener) mql.addEventListener('change', handler as any);
    else (mql as any).addListener(handler as any);
    return () => {
      if (mql.removeEventListener)
        mql.removeEventListener('change', handler as any);
      else (mql as any).removeListener(handler as any);
    };
  }, []);

  const [formData, setFormData] = useState<FormData>({
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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: keyof FormData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        toastMethods.error('Passwords do not match', 'Please confirm your password.');
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/signin`,
        },
      });

      if (authError) throw authError;

      // Best-effort: insert address hierarchy now if session exists
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

      if (!authData.session) {
        toastMethods.success(
          'Check your email',
          'We sent a confirmation link to verify your account.'
        );
        navigate('/auth/signin');
        return;
      }

      toastMethods.success(
        'Account Created!',
        'Your account has been successfully created.'
      );
      navigate('/customer');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toastMethods.error(
        'Sign Up Failed',
        error?.message || 'There was an issue creating your account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
    } catch (error) {
      console.error('Google sign up error:', error);
      toastMethods.error(
        'Google Sign-Up Failed',
        'There was an issue signing up with Google.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const isStepValid = (step: number): boolean => {
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

  const renderProgressIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3].map(step => (
        <React.Fragment key={step}>
          <div className="flex items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                step < currentStep
                  ? 'bg-brand-primary border-brand-primary text-white'
                  : step === currentStep
                    ? 'bg-brand-primary border-brand-primary text-white'
                    : 'bg-white border-neutral-300 text-neutral-400'
              )}
            >
              {step < currentStep ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <span className="text-sm font-semibold">{step}</span>
              )}
            </div>
          </div>
          {step < 3 && (
            <div
              className={cn(
                'w-16 h-0.5 mx-2 transition-all duration-300',
                step < currentStep ? 'bg-brand-primary' : 'bg-neutral-300'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStepTitle = () => {
    const titles = {
      1: 'Account Information',
      2: 'Personal Information',
      3: 'Address Information',
    };
    return titles[currentStep as keyof typeof titles];
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
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
                placeholder="At least 8 characters"
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

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={e =>
                  handleInputChange('confirmPassword', e.target.value)
                }
                required
                className="pr-24"
                wrapperClassName="relative"
              >
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </Input>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* First Name Field */}
            <div className="space-y-2">
              <Input
                label="First Name"
                type="text"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={e => handleInputChange('firstName', e.target.value)}
                required
                className="pr-12"
                wrapperClassName="relative"
              >
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <User className="w-5 h-5" />
                </div>
              </Input>
            </div>

            {/* Last Name Field */}
            <div className="space-y-2">
              <Input
                label="Last Name"
                type="text"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={e => handleInputChange('lastName', e.target.value)}
                required
                className="pr-12"
                wrapperClassName="relative"
              >
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <User className="w-5 h-5" />
                </div>
              </Input>
            </div>

            {/* Phone Number Field */}
            <div className="space-y-2">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+63 9XXXXXXXXX"
                value={
                  formData.phone.startsWith('+63')
                    ? formData.phone
                    : formData.phone
                      ? `+63${formData.phone.replace(/^0+/, '')}`
                      : '+63'
                }
                onChange={e => {
                  let value = e.target.value;

                  // Always start with +63
                  if (!value.startsWith('+63')) {
                    value =
                      '+63' + value.replace(/^0+/, '').replace(/^\+?63/, '');
                  }

                  // Remove all non-digits after +63
                  let digits = value.slice(3).replace(/\D/g, '');

                  // Limit to 10 digits after +63
                  digits = digits.slice(0, 10);

                  // Reconstruct value
                  value = '+63' + digits;

                  // Prevent user from deleting +63
                  if (value.length < 3) {
                    value = '+63';
                  }

                  handleInputChange('phone', value);
                }}
                maxLength={13} // +63 + 10 digits
                required
                className="pr-12"
                wrapperClassName="relative"
              >
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Phone className="w-5 h-5" />
                </div>
              </Input>
            </div>

            {/* Gender Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Gender <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.gender}
                  onChange={e => handleInputChange('gender', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors appearance-none bg-white"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Birthday Field */}
            <div className="space-y-2">
              <Input
                label="Birthday"
                type="date"
                placeholder="mm/dd/yyyy"
                value={formData.birthday}
                onChange={e => handleInputChange('birthday', e.target.value)}
                required
                // Removed calendar icon and extra padding
                className=""
                wrapperClassName=""
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Building/House Number Field */}
            <div className="space-y-2">
              <Input
                label="Building/House Number (optional)"
                type="text"
                placeholder="Enter building or house number"
                value={formData.buildingNumber}
                onChange={e =>
                  handleInputChange('buildingNumber', e.target.value)
                }
                className="pr-12"
                wrapperClassName="relative"
              >
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"></div>
              </Input>
            </div>

            {/* Street Field */}
            <div className="space-y-2">
              <Input
                label="Street"
                type="text"
                placeholder="Enter street name"
                value={formData.street}
                onChange={e => handleInputChange('street', e.target.value)}
                required
                className="pr-12"
                wrapperClassName="relative"
              >
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <MapPin className="w-5 h-5" />
                </div>
              </Input>
            </div>

            {/* Barangay Field */}
            <div className="space-y-2">
              <Input
                label="Barangay"
                type="text"
                placeholder="Enter barangay"
                value={formData.barangay}
                onChange={e => handleInputChange('barangay', e.target.value)}
                required
                className="pr-12"
                wrapperClassName="relative"
              >
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <MapPin className="w-5 h-5" />
                </div>
              </Input>
            </div>

            {/* Region Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Region <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.region}
                  onChange={e => handleInputChange('region', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors appearance-none bg-white"
                >
                  <option value="NCR">NCR</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Province Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Province <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.province}
                  onChange={e => handleInputChange('province', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors appearance-none bg-white"
                >
                  <option value="">Select province</option>
                  <option value="metro-manila">Metro Manila</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* City/Municipality Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                City/Municipality <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.city}
                  onChange={e => handleInputChange('city', e.target.value)}
                  required
                  disabled={!formData.province}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors appearance-none bg-white disabled:bg-neutral-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formData.province
                      ? 'Select city/municipality'
                      : 'Select province first'}
                  </option>
                  {formData.province === 'metro-manila' && (
                    <>
                      <option value="manila">Manila</option>
                    </>
                  )}
                  {/* Add more cities for other provinces as needed */}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Country Field removed */}

            {/* Terms Agreement */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={e =>
                  handleCheckboxChange('agreeToTerms', e.target.checked)
                }
                className="w-4 h-4 text-brand-primary border-neutral-300 rounded focus:ring-brand-primary focus:ring-2 mt-1"
                required
              />
              <label
                htmlFor="agreeToTerms"
                className="text-sm text-neutral-700"
              >
                I agree to the{' '}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-brand-primary hover:text-brand-primary-700 underline p-0 h-auto"
                  onClick={() => console.log('Show terms of service')}
                >
                  Terms of Service
                </Button>{' '}
                and{' '}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-brand-primary hover:text-brand-primary-700 underline p-0 h-auto"
                  onClick={() => console.log('Show privacy policy')}
                >
                  Privacy Policy
                </Button>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderNavigationButtons = () => (
    <div className="flex space-x-4 mt-8">
      {currentStep > 1 && (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          threeD
          onClick={prevStep}
          disabled={loading}
          className="flex-1 btn-responsive-primary"
        >
          Previous
        </Button>
      )}

      {currentStep < 3 ? (
        <Button
          type="button"
          variant="primary"
          size="lg"
          threeD
          onClick={nextStep}
          disabled={!isStepValid(currentStep) || loading}
          className="flex-1 btn-responsive-primary"
        >
          Next
        </Button>
      ) : (
        <Button
          type="submit"
          variant="primary"
          size="lg"
          threeD
          loading={loading}
          disabled={!isStepValid(currentStep) || loading}
          className="flex-1 btn-responsive-primary"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex items-center justify-center p-3">
      <Container size="sm" className="w-full container-responsive">
        {/* Back to Home Link */}
        <div className="mb-4">
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

        {/* Sign Up Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <Text
              variant="h1"
              size="3xl"
              weight="bold"
              className="text-neutral-900 mb-2"
            >
              Create your account
            </Text>
            <Text variant="p" size="sm" color="muted">
              Already have an account?{' '}
              <button
                className="text-brand-accent hover:text-brand-accent-700 font-medium transition-colors"
                onClick={() => navigate('/auth/signin')}
              >
                Sign in
              </button>
            </Text>
          </div>

          {/* Progress Indicator */}
          {renderProgressIndicator()}

          {/* Step Title */}
          <div className="text-center mb-6">
            <Text
              variant="h3"
              size="xl"
              weight="semibold"
              color="primary"
              className="text-center"
            >
              {renderStepTitle()}
            </Text>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderStepContent()}
            {renderNavigationButtons()}
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign Up Button */}
          <Button
            variant="secondary"
            size="lg"
            threeD
            loading={googleLoading}
            disabled={googleLoading || loading}
            className="w-full border border-neutral-300 hover:border-neutral-400"
            onClick={handleGoogleSignUp}
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
              ? 'Signing up with Google...'
              : 'Sign up with Google'}
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-4">
          <Text variant="p" size="xs" color="muted">
            By creating an account, you agree to our{' '}
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-primary hover:text-brand-primary-700 underline p-0 h-auto"
            >
              Terms of Service
            </Button>{' '}
            and{' '}
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-primary hover:text-brand-primary-700 underline p-0 h-auto"
            >
              Privacy Policy
            </Button>
          </Text>
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

export default SignUp;
