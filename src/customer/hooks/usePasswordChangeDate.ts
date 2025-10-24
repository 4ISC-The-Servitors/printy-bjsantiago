import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';
import { useAuth } from '@auth/hooks/AuthContext';

interface PasswordChangeDateResult {
  lastPasswordChange: Date | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch the last password change date from Supabase audit logs
 */
export const usePasswordChangeDate = (): PasswordChangeDateResult => {
  const [lastPasswordChange, setLastPasswordChange] = useState<Date | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPasswordChangeDate = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Since audit logs are not accessible via PostgREST, use the current user's data
        // from the auth session which includes updated_at timestamp
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error('Error fetching current user:', userError);
          setError('Failed to fetch user data');
          return;
        }

        if (currentUser?.updated_at) {
          setLastPasswordChange(new Date(currentUser.updated_at));
        } else if (currentUser?.created_at) {
          setLastPasswordChange(new Date(currentUser.created_at));
        }
      } catch (err) {
        console.error('Unexpected error fetching password change date:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPasswordChangeDate();
  }, [user?.id]);

  return {
    lastPasswordChange,
    isLoading,
    error,
  };
};
