import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Text, Container } from '@shared/components';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '@lib/supabase';

const ConfirmEmail: React.FC = () => {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // Guard: Check if user came from a valid email confirmation link
  useEffect(() => {
    const checkValidAccess = () => {
      // Check if there's a hash fragment with access_token (from email confirmation)
      // This is the primary indicator that they came from an email confirmation link
      const hash = window.location.hash;
      const hasAccessToken = hash.includes('access_token=');
      const hasType =
        hash.includes('type=signup') || hash.includes('type=email');

      // Also check URL search params (some email clients might use query params)
      const urlParams = new URLSearchParams(window.location.search);
      const hasTokenParam =
        urlParams.has('token') || urlParams.has('access_token');

      // Valid ONLY if there's an access token in hash or token in query params
      // We don't check for existing sessions because that could be from a previous login
      const isValidAccess =
        hasAccessToken || (hasType && hash) || hasTokenParam;

      if (!isValidAccess) {
        // No valid confirmation token found - user is manually accessing the page
        // Redirect to sign in immediately
        navigate('/auth/signin', { replace: true });
        setIsValid(false);
        return false;
      }

      setIsValid(true);
      return true;
    };

    checkValidAccess();
  }, [navigate]);

  useEffect(() => {
    // Don't proceed if access is not valid
    if (isValid === false) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      // Ensure Supabase has had a chance to process the URL and create a session, if any
      await supabase.auth.getSession();

      // Immediately sign out so the Sign In page doesn't auto-redirect to /customer
      // Clear all session data and storage
      try {
        // Sign out from Supabase
        await supabase.auth.signOut();

        // Clear any stored user data in localStorage
        localStorage.removeItem('user');

        // Clear any session storage items
        sessionStorage.removeItem('signin-success');
        sessionStorage.removeItem('logout-success');

        // Wait a bit to ensure sign-out completes and AuthContext updates
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify session is cleared
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          // If session still exists, try signing out again
          await supabase.auth.signOut();
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error('Error signing out:', error);
        // Still try to clear storage even if sign-out fails
        localStorage.removeItem('user');
        sessionStorage.removeItem('signin-success');
        sessionStorage.removeItem('logout-success');
      }

      if (!cancelled) {
        setDone(true);
      }
    };

    // Only run if access is valid
    if (isValid === true) {
      run();
    }

    return () => {
      cancelled = true;
    };
  }, [isValid]);

  // Don't render if access is not valid (will redirect)
  if (isValid === false) {
    return null;
  }

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
                    onClick={async () => {
                      // Ensure we're signed out before navigating
                      try {
                        await supabase.auth.signOut();
                        localStorage.removeItem('user');
                        sessionStorage.removeItem('signin-success');
                        sessionStorage.removeItem('logout-success');

                        // Wait for auth state to update and verify session is cleared
                        let attempts = 0;
                        while (attempts < 10) {
                          await new Promise(resolve =>
                            setTimeout(resolve, 100)
                          );
                          const {
                            data: { session: currentSession },
                          } = await supabase.auth.getSession();
                          if (!currentSession) {
                            break;
                          }
                          attempts++;
                          // If session still exists after multiple attempts, try signing out again
                          if (attempts > 3) {
                            await supabase.auth.signOut();
                          }
                        }
                      } catch (error) {
                        console.error(
                          'Error signing out before navigation:',
                          error
                        );
                      }
                      navigate('/auth/signin');
                    }}
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
