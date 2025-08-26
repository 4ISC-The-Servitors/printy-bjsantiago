import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Text, Container } from '../../components/shared';
import { Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    keepLoggedIn: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Hardcoded credentials for prototype routing
  const credentials: Record<string, { password: string; role: 'customer' | 'valued' | 'admin' | 'superadmin'; route: string }> = {
    'customer@example.com': { password: 'customer123', role: 'customer', route: '/customer' },
    'valued@example.com': { password: 'valued123', role: 'valued', route: '/valued' },
    'admin@example.com': { password: 'admin123', role: 'admin', route: '/admin' },
    'superadmin@example.com': { password: 'superadmin123', role: 'superadmin', route: '/superadmin' },
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const entry = credentials[formData.email.trim().toLowerCase()];
    if (!entry || entry.password !== formData.password) {
      setError('Invalid email or password.');
      return;
    }

    // Optionally persist prototype session
    if (formData.keepLoggedIn) {
      try {
        localStorage.setItem('prototype_role', entry.role);
        localStorage.setItem('prototype_email', formData.email.trim().toLowerCase());
      } catch {}
    }

    navigate(entry.route);
  };

  const handleGoogleSignIn = () => {
    // TODO: Implement Google sign-in
    console.log('Google sign-in clicked');
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
            <Text variant="h1" size="4xl" weight="bold" className="text-neutral-900 mb-2">
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
            {error && (
              <div className="rounded-md bg-error-50 border border-error p-3 text-sm text-error">
                {error}
              </div>
            )}
            {/* Email Field */}
            <div className="space-y-2">
              <Input
                label="Email"
                type="email"
                placeholder="you@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
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
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className="pr-24"
                wrapperClassName="relative"
              >
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  onChange={(e) => handleInputChange('keepLoggedIn', e.target.checked)}
                  className="w-4 h-4 text-brand-primary border-neutral-300 rounded focus:ring-brand-primary focus:ring-2"
                />
                <Text variant="span" size="sm" className="text-neutral-700">
                  Keep me logged in
                </Text>
              </label>
              
              <button
                type="button"
                className="text-error hover:text-error-700 text-sm font-medium transition-colors"
                onClick={() => navigate('/auth/reset-password')}
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
              className="w-full btn-responsive-primary"
            >
              Sign in
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
            Sign in with Google
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default SignIn;