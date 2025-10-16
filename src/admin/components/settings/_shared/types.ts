export type DataRetentionOption = '30_days' | '90_days' | '1_year' | 'indefinite';

export interface SystemPreferencesData {
  autoBackup: boolean;
  maintenanceMode: boolean;
  debugLogging: boolean;
  performanceMonitoring: boolean;
  dataRetention: DataRetentionOption;
}

export interface UserManagementSettingsData {
  autoApproval: boolean;
  requireEmailVerification: boolean;
  allowGuestAccess: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
}

export interface SecuritySettingsProps {
  onPasswordUpdated?: () => void;
}


