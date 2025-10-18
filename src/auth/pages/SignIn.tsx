// BACKEND_TODO: Wire Supabase Auth here (email/password + OAuth)
// after role-based routing/guards are implemented. Persist session and support remember-me.
// Also replace any mock/toast-only flows with real error handling from Supabase.
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, ToastContainer } from '@shared/components';
import Header from '@auth/components/SignIn/Header';
import SignInForm from '@auth/components/SignIn/SignInForm';
import { useSignIn } from '@auth/components/SignIn/useSignIn';
import { ArrowLeft } from 'lucide-react';

// TODO: Backend Integration
// - Replace hardcoded credentials with real Supabase authentication
// - Implement proper JWT token management
// - Add user session persistence
// - Implement role-based routing based on user profile
// - Add proper error handling for authentication failures
// - Implement "Keep me logged in" functionality with refresh tokens

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const {
    toasts,
    toast,
    formData,
    setField,
    showPassword,
    setShowPassword,
    loading,
    isDesktop,
    handleSubmit,
  } = useSignIn();

  // Check for logout success toast
  useEffect(() => {
    if (sessionStorage.getItem('logout-success') === 'true') {
      sessionStorage.removeItem('logout-success');
      toast.success('Logged Out', 'You have been successfully logged out');
    }
  }, [toast]);

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
          <Header onNavigateSignUp={() => navigate('/auth/signup')} />

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <SignInForm
              email={formData.email}
              password={formData.password}
              keepLoggedIn={formData.keepLoggedIn}
              loading={loading}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              onChange={(f, v) => setField(f, v)}
              onForgotPassword={() => navigate('/auth/forgot-password')}
            />
          </form>
        </div>
      </Container>

      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        onRemoveToast={toast.remove}
        position={isDesktop ? 'bottom-right' : 'top-center'}
      />
    </div>
  );
};

export default SignIn;
