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
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// TODO: Backend Integration
// - Implement real password reset with Supabase Auth
// - Send actual password reset email
// - Handle password reset token validation
// - Implement password reset confirmation page
// - Add proper error handling for invalid emails
// - Add rate limiting for password reset requests

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [toasts, toastMethods] = useToast();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setIsDesktop(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', handleModern);
    else (mql as MediaQueryList).addListener(handleLegacy);
    return () => {
      if (mql.removeEventListener)
        mql.removeEventListener('change', handleModern);
      else (mql as MediaQueryList).removeListener(handleLegacy);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate email format
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
        toastMethods.error(
          'Invalid Email',
          'Please enter a valid email address.'
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      });

      if (error) throw error;

      setSubmitted(true);
      toastMethods.success(
        'Success!',
        'We have sent a reset link to your email.'
      );
    } catch (error) {
      console.error('Password reset error:', error);
      toastMethods.error(
        'Password Reset Failed',
        'There was an issue sending the reset link. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex items-center justify-center p-4">
      <Container size="sm" className="w-full container-responsive">
        {/* Back Navigation */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            threeD
            className="text-neutral-600 hover:text-brand-primary"
            onClick={() => navigate('/auth/signin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </Button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8">
          {!submitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <Text
                  variant="h1"
                  size="4xl"
                  weight="bold"
                  className="text-neutral-900 mb-2"
                >
                  Reset your password
                </Text>
                <Text variant="p" size="base" color="muted">
                  Enter the email associated with your account and we'll send
                  you a reset link.
                </Text>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="pr-12"
                    wrapperClassName="relative"
                  >
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Mail className="w-5 h-5" />
                    </div>
                  </Input>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  threeD
                  className="w-full btn-responsive-primary"
                  loading={loading}
                  disabled={
                    loading ||
                    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
                  }
                >
                  {loading ? 'Sending reset link...' : 'Send reset link'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-success" />
                <Text
                  variant="h2"
                  size="3xl"
                  weight="bold"
                  className="text-neutral-900"
                >
                  Check your email
                </Text>
                <Text variant="p" color="muted" className="max-w-md">
                  If an account exists for <strong>{email}</strong>, you'll
                  receive an email with a link to reset your password. The link
                  will expire in 15 minutes.
                </Text>
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    variant="primary"
                    threeD
                    onClick={() => navigate('/auth/signin')}
                  >
                    Return to sign in
                  </Button>
                  <Button
                    variant="ghost"
                    threeD
                    onClick={() => {
                      setSubmitted(false);
                      setEmail('');
                      toastMethods.info(
                        'Reset Form',
                        'You can now enter a different email address.'
                      );
                    }}
                  >
                    Use a different email
                  </Button>
                </div>
              </div>
            </>
          )}
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

export default ForgotPassword;
