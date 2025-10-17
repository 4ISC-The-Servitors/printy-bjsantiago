/**
 * useLogoutWithToast
 * Centralized logout flow with success/error toasts and optional redirect.
 * Reuse across customer/admin so behavior stays consistent.
 */
import { useNavigate } from 'react-router-dom';
import { supabase } from '@lib/supabase';
import { useToast } from '@lib/useToast';

export function useLogoutWithToast() {
  const [toasts, toast] = useToast();
  const navigate = useNavigate();

  const logout = async (
    redirectPath: string = '/auth/signin',
    delayMs: number = 1500 // Parameter kept for backward compatibility but unused
  ) => {
    try {
      // Clear the session from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        // surface error to user
        toast.error('Logout Error', 'Failed to log out. Please try again.');
        return false;
      }

      // Clear any local storage related to user session
      localStorage.removeItem('user');

      // Store logout success flag for signin page to show toast
      sessionStorage.setItem('logout-success', 'true');

      // Navigate immediately - toast will show on signin page
      navigate(redirectPath, { replace: true });
      return true;
    } catch (e) {
      toast.error(
        'Logout Error',
        'An unexpected error occurred. Please try again.'
      );
      return false;
    }
  };

  return { logout, toasts, toast } as const;
}

export default useLogoutWithToast;
