import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';
import { supabase } from '@lib/supabase';
import { Modal, Text, Button, ToastContainer } from '@shared/components';
import { useToast } from '@lib/useToast';
import { useDeviceUtils } from '@shared/hooks/ui';
import { X } from 'lucide-react';

/**
 * SuperAdminRoot Component
 *
 * Provides layout and navigation for superadmin pages.
 * Includes logout functionality with proper session cleanup.
 */
const SuperAdminRoot: React.FC = () => {
  const navigate = useNavigate();
  const [toasts, toast] = useToast();
  const { isMobileOrTablet } = useDeviceUtils();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check for signin success toast
  useEffect(() => {
    if (sessionStorage.getItem('signin-success') === 'true') {
      sessionStorage.removeItem('signin-success');
      toast.success('Welcome back!', 'Successfully signed in');
    }
  }, [toast]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      // CRITICAL: Always call supabase.auth.signOut() to clear session
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error);
        toast.error('Logout failed', 'Please try again');
        setIsLoggingOut(false);
        return;
      }

      // Clear any local storage related to user session
      localStorage.removeItem('user');

      setShowLogoutModal(false);

      // Store logout success flag for signin page to show toast
      sessionStorage.setItem('logout-success', 'true');

      // Navigate immediately - toast will show on signin page
      navigate('/auth/signin', { replace: true });
    } catch (err) {
      console.error('Unexpected logout error:', err);
      toast.error('Logout failed', 'An unexpected error occurred');
      setIsLoggingOut(false);
    }
  };

  const handleRefreshData = () => {
    // Dispatch custom event that Dashboard can listen to
    window.dispatchEvent(new CustomEvent('superadmin-refresh-data'));
    toast.info('Refreshing data', 'KPI data is being updated');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-700">
                PRINTY SuperAdmin
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefreshData}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                title="Refresh KPI data"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => !isLoggingOut && setShowLogoutModal(false)}
        size="sm"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200">
          <div className="flex items-center justify-between p-6 pb-4">
            <Text variant="h3" size="lg" weight="semibold">
              Confirm Logout
            </Text>
            {!isLoggingOut && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogoutModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="px-6 pb-4">
            <Text variant="p">
              Are you sure you want to log out? You'll need to sign in again to
              access the superadmin dashboard.
            </Text>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowLogoutModal(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={confirmLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onRemoveToast={toast.remove}
        position={isMobileOrTablet ? 'top-center' : 'bottom-right'}
      />
    </div>
  );
};

export default SuperAdminRoot;
