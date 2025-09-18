// BACKEND_TODO: Replace local state with Supabase-backed profile, preferences, and notifications.
// Hydrate on mount and persist via RPCs or direct table updates with RLS. Remove demo data below.
import React, { useState, useEffect } from 'react';
import { Container, Text, Card, ToastContainer } from '../../components/shared';
import { useToast } from '../../lib/useToast';
//
import * as SettingsDesktop from '../../components/admin/settings/desktop';
import * as SettingsMobile from '../../components/admin/settings/mobile';

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
  // Wrapped by AdminLayout at route level; no internal layout duplication

  // TODO(BACKEND): Replace local state with data fetched from backend (Supabase)
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [systemPrefs, setSystemPrefs] = useState<SystemPreferencesData | null>(
    null
  );
  const [userMgmt, setUserMgmt] = useState<UserManagementData | null>(null);
  const [notifications, setNotifications] =
    useState<AdminNotificationData | null>(null);

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

  // Removed unused initials variable since AdminProfileCard is not currently used

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
    <div className="min-h-[calc(100vh-0px)]">
      <Container size="xl" className="py-6 md:py-10">
        <div className="space-y-6 md:space-y-8">
          {adminData && (
            <Card className="p-6">
              <Text variant="h3" size="lg" weight="semibold" className="mb-4">
                Admin Profile
              </Text>
              <Text variant="p" size="sm" color="muted">
                AdminProfileCard component needs to be recreated for the new
                structure. Current user: {adminData.displayName} (
                {adminData.email})
              </Text>
            </Card>
          )}

          {systemPrefs &&
            (isDesktop ? (
              <SettingsDesktop.SystemPreferences
                value={systemPrefs}
                onUpdate={handleSystemPrefsUpdate}
              />
            ) : (
              <SettingsMobile.SystemPreferences
                value={systemPrefs}
                onUpdate={handleSystemPrefsUpdate}
              />
            ))}

          {userMgmt &&
            (isDesktop ? (
              <SettingsDesktop.UserManagementSettings
                value={userMgmt}
                onUpdate={handleUserMgmtUpdate}
              />
            ) : (
              <SettingsMobile.UserManagementSettings
                value={userMgmt}
                onUpdate={handleUserMgmtUpdate}
              />
            ))}

          {isDesktop ? (
            <SettingsDesktop.SecuritySettings
              onPasswordUpdated={() =>
                toast.success(
                  'Password updated',
                  'Your admin password has been changed successfully.'
                )
              }
            />
          ) : (
            <SettingsMobile.SecuritySettings
              onPasswordUpdated={() =>
                toast.success(
                  'Password updated',
                  'Your admin password has been changed successfully.'
                )
              }
            />
          )}

          {notifications &&
            (isDesktop ? (
              <SettingsDesktop.NotificationSettings
                value={notifications}
                onToggle={handleNotificationUpdate}
              />
            ) : (
              <SettingsMobile.NotificationSettings
                value={notifications}
                onToggle={handleNotificationUpdate}
              />
            ))}
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
