import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Text, Container } from '@shared/components';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '@lib/supabase';

const ConfirmEmail: React.FC = () => {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Ensure Supabase has had a chance to process the URL and create a session, if any
      await supabase.auth.getSession();
      // Immediately sign out so the Sign In page doesn't auto-redirect to /customer
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
      if (!cancelled) {
        setDone(true);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex items-center justify-center p-4">
      <Container size="sm" className="w-full container-responsive">
        {/* Back Navigation */}
        <div className="mb-8"></div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8">
          {!done ? (
            <div className="text-center">
              <Text
                variant="h1"
                size="4xl"
                weight="bold"
                className="text-neutral-900 mb-2"
              >
                Confirming your email...
              </Text>
              <Text variant="p" size="base" color="muted">
                Please wait while we verify your email address.
              </Text>
            </div>
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
                  Email confirmed
                </Text>
                <Text variant="p" color="muted" className="max-w-md">
                  Your email has been successfully confirmed. You can now sign
                  in to your account.
                </Text>
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    variant="primary"
                    threeD
                    onClick={() => navigate('/auth/signin')}
                  >
                    Go to sign in
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

export default ConfirmEmail;
