import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Text,
  Container,
  ToastContainer,
  SocialAuthButton,
} from '../../components/shared';
import ProgressIndicator from '../../components/auth/SignUp/ProgressIndicator';
import Step1Account from '../../components/auth/SignUp/Step1Account';
import Step2Personal from '../../components/auth/SignUp/Step2Personal';
import Step3Address from '../../components/auth/SignUp/Step3Address';
import NavigationButtons from '../../components/auth/SignUp/NavigationButtons';
import { useSignUp } from '../../components/auth/SignUp/useSignUp';
import { ArrowLeft } from 'lucide-react';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const {
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
  } = useSignUp();

  const titles: Record<number, string> = {
    1: 'Account Information',
    2: 'Personal Information',
    3: 'Address Information',
  };

  const next = () => currentStep < 3 && setCurrentStep(currentStep + 1);
  const prev = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex items-center justify-center p-3">
      <Container size="sm" className="w-full container-responsive">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            threeD
            className="text-neutral-600 hover:text-brand-primary"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to home
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6">
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

          <ProgressIndicator currentStep={currentStep} />

          <div className="text-center mb-6">
            <Text
              variant="h3"
              size="xl"
              weight="semibold"
              color="primary"
              className="text-center"
            >
              {titles[currentStep]}
            </Text>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <Step1Account
                email={formData.email}
                password={formData.password}
                confirmPassword={formData.confirmPassword}
                onChange={(f, v) => setField(f, v)}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
              />
            )}
            {currentStep === 2 && (
              <Step2Personal
                firstName={formData.firstName}
                lastName={formData.lastName}
                phone={formData.phone}
                gender={formData.gender}
                birthday={formData.birthday}
                onChange={(f, v) => setField(f, v)}
              />
            )}
            {currentStep === 3 && (
              <Step3Address
                buildingNumber={formData.buildingNumber}
                street={formData.street}
                barangay={formData.barangay}
                region={formData.region}
                province={formData.province}
                city={formData.city}
                agreeToTerms={formData.agreeToTerms}
                onChange={(f, v) => setField(f, v)}
                onToggleTerms={v => setField('agreeToTerms', v)}
              />
            )}
            <NavigationButtons
              currentStep={currentStep}
              loading={loading}
              isStepValid={isStepValid}
              onPrev={prev}
              onNext={next}
            />
          </form>

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

          <SocialAuthButton
            provider="google"
            loading={googleLoading}
            disabled={googleLoading || loading}
            onClick={handleGoogleSignUp}
            label={
              googleLoading
                ? 'Signing up with Google...'
                : 'Sign up with Google'
            }
          />
        </div>

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

      <ToastContainer
        toasts={toasts}
        onRemoveToast={toast.remove}
        position={isDesktop ? 'bottom-right' : 'top-center'}
      />
    </div>
  );
};

export default SignUp;
