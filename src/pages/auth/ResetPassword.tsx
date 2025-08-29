import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Text, Container, ToastContainer } from '../../components/shared';
import { useToast } from '../../lib/useToast';
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// TODO: Backend Integration
// - Validate access token and type from URL
// - Handle Supabase updateUser for new password
// - Provide robust error messages and edge-case handling

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [toasts, toastMethods] = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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
      if (mql.removeEventListener) mql.removeEventListener('change', handler as any);
      else (mql as any).removeListener(handler as any);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!password || password.length < 8) {
        toastMethods.error('Weak Password', 'Password must be at least 8 characters.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        toastMethods.error('Passwords do not match', 'Please confirm your new password.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setDone(true);
      toastMethods.success('Password Updated', 'Your password has been reset successfully.');
      setTimeout(() => navigate('/auth/signin'), 1200);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toastMethods.error('Reset Failed', error?.message || 'Unable to reset password. Try the link again.');
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
          {!done ? (
            <>
              <div className="text-center mb-8">
                <Text variant="h1" size="4xl" weight="bold" className="text-neutral-900 mb-2">
                  Set a new password
                </Text>
                <Text variant="p" size="base" color="muted">
                  Enter your new password below to complete the reset.
                </Text>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    wrapperClassName="relative"
                    className="pr-12"
                  >
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </Input>
                </div>

                <div className="space-y-2">
                  <Input
                    label="Confirm New Password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    wrapperClassName="relative"
                    className="pr-12"
                  >
                    <button
                      type="button"
                      onClick={() => setShowConfirm(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </Input>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  threeD
                  className="w-full btn-responsive-primary"
                  loading={loading}
                  disabled={loading || !password || !confirmPassword}
                >
                  {loading ? 'Updating password...' : 'Update password'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-success" />
                <Text variant="h2" size="3xl" weight="bold" className="text-neutral-900">
                  Password updated
                </Text>
                <Text variant="p" color="muted" className="max-w-md">
                  Your password has been successfully reset. You can now sign in with your new password.
                </Text>
                <div className="flex items-center gap-3 mt-2">
                  <Button variant="primary" threeD onClick={() => navigate('/auth/signin')}>
                    Go to sign in
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

export default ResetPassword;
