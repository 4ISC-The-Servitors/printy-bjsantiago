// Shared types for Admin Settings (desktop/mobile)

export type DataRetentionOption =
  | '30_days'
  | '90_days'
  | '1_year'
  | 'indefinite';

export interface SystemPreferencesData {
  autoBackup: boolean;
  maintenanceMode: boolean;
  debugLogging: boolean;
  performanceMonitoring: boolean;
  dataRetention: DataRetentionOption;
}

export interface SecuritySettingsProps {
  onPasswordUpdated?: () => void;
}

export interface UserManagementSettingsData {
  autoApproval: boolean;
  requireEmailVerification: boolean;
  allowGuestAccess: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number; // in minutes
}
