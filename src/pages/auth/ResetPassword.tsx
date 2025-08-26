import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Text, Container } from '../../components/shared';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Prototype: mimic API call
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex items-center justify-center p-4">
      <Container size="sm" className="w-full">
        {/* Back Navigation */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
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
                <Text variant="h1" size="4xl" weight="bold" className="text-neutral-900 mb-2">
                  Reset your password
                </Text>
                <Text variant="p" size="base" color="muted">
                  Enter the email associated with your account and we'll send you a reset link.
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
                    onChange={(e) => setEmail(e.target.value)}
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
                  className="w-full"
                  loading={loading}
                  disabled={loading}
                >
                  Send reset link
                </Button>
              </form>

              {/* Help text */}
              <div className="text-center mt-6">
                <Text variant="p" size="sm" color="muted">
                  Remembered your password?{' '}
                  <button 
                    className="text-brand-primary hover:text-brand-primary-700 underline"
                    onClick={() => navigate('/auth/signin')}
                  >
                    Sign in
                  </button>
                </Text>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-success" />
                <Text variant="h2" size="3xl" weight="bold" className="text-neutral-900">
                  Check your email
                </Text>
                <Text variant="p" color="muted" className="max-w-md">
                  If an account exists for <strong>{email}</strong>, you'll receive an email with a link to reset your password. The link will expire in 15 minutes.
                </Text>
                <div className="flex items-center gap-3 mt-2">
                  <Button variant="primary" onClick={() => navigate('/auth/signin')}>
                    Return to sign in
                  </Button>
                  <Button variant="ghost" onClick={() => setSubmitted(false)}>
                    Use a different email
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Container>
    </div>
  );
};

export default ResetPassword;
