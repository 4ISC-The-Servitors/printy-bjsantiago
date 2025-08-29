import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Text,
  ToastContainer,
  Button,
} from '../../../components/shared';
import { useToast } from '../../../lib/useToast';
import { ArrowLeft } from 'lucide-react';
import {
  AdminProfileCard,
  SystemPreferences,
  UserManagementSettings,
  SecuritySettings,
  NotificationSettings,
} from '../../../components/admin/adminSettings';

export interface AdminData {
  displayName: string;
  email: string;
  role: 'admin' | 'super_admin';
  department: string;
  permissions: string[];
  lastLogin: string;
  avatarUrl?: string;
}

export interface SystemPreferencesData {
  autoBackup: boolean;
  maintenanceMode: boolean;
  debugLogging: boolean;
  performanceMonitoring: boolean;
  dataRetention: '30_days' | '90_days' | '1_year' | 'indefinite';
}

export interface UserManagementData {
  autoApproval: boolean;
  requireEmailVerification: boolean;
  allowGuestAccess: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
}

export interface AdminNotificationData {
  systemAlerts: boolean;
  userReports: boolean;
  securityEvents: boolean;
  performanceIssues: boolean;
  maintenanceUpdates: boolean;
}

const AdminSettingsPage: React.FC = () => {
  const [toasts, toast] = useToast();
  const navigate = useNavigate();

  // TODO(BACKEND): Replace local state with data fetched from backend (Supabase)
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [systemPrefs, setSystemPrefs] = useState<SystemPreferencesData | null>(null);
  const [userMgmt, setUserMgmt] = useState<UserManagementData | null>(null);
  const [notifications, setNotifications] = useState<AdminNotificationData | null>(null);

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // TODO(BACKEND): Fetch admin profile and preferences from backend
    setAdminData({
      displayName: 'Admin User',
      email: 'admin@printy.com',
      role: 'admin',
      department: 'Operations',
      permissions: ['user_management', 'system_settings', 'reports'],
      lastLogin: '2024-01-15T10:30:00Z',
      avatarUrl: '',
    });
    
    setSystemPrefs({
      autoBackup: true,
      maintenanceMode: false,
      debugLogging: false,
      performanceMonitoring: true,
      dataRetention: '90_days',
    });
    
    setUserMgmt({
      autoApproval: false,
      requireEmailVerification: true,
      allowGuestAccess: true,
      maxLoginAttempts: 5,
      sessionTimeout: 30,
    });
    
    setNotifications({
      systemAlerts: true,
      userReports: true,
      securityEvents: true,
      performanceIssues: true,
      maintenanceUpdates: true,
    });
  }, []);

  const initials = useMemo(
    () =>
      (adminData?.displayName || '')
        .split(' ')
        .map(n => n[0])
        .join(''),
    [adminData?.displayName]
  );

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

  const handleSystemPrefsUpdate = (updates: Partial<SystemPreferencesData>) => {
    if (!systemPrefs) return;
    setSystemPrefs({ ...systemPrefs, ...updates });
    toast.success('Updated', 'System preferences have been updated.');
  };

  const handleUserMgmtUpdate = (updates: Partial<UserManagementData>) => {
    if (!userMgmt) return;
    setUserMgmt({ ...userMgmt, ...updates });
    toast.success('Updated', 'User management settings have been updated.');
  };

  const handleNotificationUpdate = (key: keyof AdminNotificationData) => {
    if (!notifications) return;
    const turnedOn = !notifications[key];
    setNotifications({ ...notifications, [key]: turnedOn });
    
    const labelMap: Record<keyof AdminNotificationData, string> = {
      systemAlerts: 'system alerts',
      userReports: 'user reports',
      securityEvents: 'security events',
      performanceIssues: 'performance issues',
      maintenanceUpdates: 'maintenance updates',
    };

    if (turnedOn) {
      toast.info('Preference updated', `Turned on ${labelMap[key]}`);
    } else {
      toast.info('Preference updated', `Turned off ${labelMap[key]}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50">
      <Container size="xl" className="py-6 md:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Button
            onClick={() => navigate('/admin')}
            variant="secondary"
            size="sm"
            threeD
            className="h-9 w-9 md:h-auto md:w-auto md:px-4 md:py-2 p-0 flex items-center justify-center"
            aria-label="Back to admin dashboard"
          >
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Back</span>
          </Button>
          <Text variant="h1" size="2xl" weight="bold">
            Admin Settings
          </Text>
        </div>

        <div className="space-y-6 md:space-y-8">
          {adminData && (
            <AdminProfileCard
              initials={initials}
              data={adminData}
            />
          )}

          {systemPrefs && (
            <SystemPreferences
              value={systemPrefs}
              onUpdate={handleSystemPrefsUpdate}
            />
          )}

          {userMgmt && (
            <UserManagementSettings
              value={userMgmt}
              onUpdate={handleUserMgmtUpdate}
            />
          )}

          <SecuritySettings
            onPasswordUpdated={() =>
              toast.success(
                'Password updated',
                'Your admin password has been changed successfully.'
              )
            }
          />

          {notifications && (
            <NotificationSettings
              value={notifications}
              onToggle={handleNotificationUpdate}
            />
          )}
        </div>
      </Container>

      <ToastContainer
        toasts={toasts}
        onRemoveToast={toast.remove}
        position={isDesktop ? 'bottom-right' : 'top-center'}
      />
    </div>
  );
};

export default AdminSettingsPage;
