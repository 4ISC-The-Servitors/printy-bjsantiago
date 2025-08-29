import React, { useState } from 'react';
import { Container, Text, Card, Badge, NotificationCenter, DataInsights, MobileWorkflow } from '../index';
import {
  AdminProfileCard,
  SystemPreferences,
  UserManagementSettings,
  SecuritySettings,
  NotificationSettings,
} from '../../admin/adminSettings';
import type { AdminNotification } from '../index';
import type { ChartData } from '../index';
import type { WorkflowAction } from '../index';

const AdminComponentsShowcase: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Order Completed',
      message: 'Order #12345 has been successfully completed and shipped',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
      priority: 'high',
      category: 'order',
      action: {
        label: 'View Order',
        onClick: () => console.log('View order clicked')
      },
      dismissible: true
    },
    {
      id: '2',
      type: 'warning',
      title: 'Low Inventory Alert',
      message: 'Premium paper stock is running low (15% remaining)',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      priority: 'medium',
      category: 'service',
      dismissible: true
    },
    {
      id: '3',
      type: 'info',
      title: 'System Update',
      message: 'New features have been deployed to the admin dashboard',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: true,
      priority: 'low',
      category: 'system'
    }
  ]);

  const [charts] = useState<ChartData[]>([
    {
      id: '1',
      title: 'Order Volume',
      type: 'bar',
      data: [
        { label: 'Jan', value: 45, change: 12, changeType: 'increase', category: 'orders', color: '#3b82f6' },
        { label: 'Feb', value: 52, change: 8, changeType: 'increase', category: 'orders', color: '#3b82f6' },
        { label: 'Mar', value: 48, change: -8, changeType: 'decrease', category: 'orders', color: '#3b82f6' },
        { label: 'Apr', value: 61, change: 27, changeType: 'increase', category: 'orders', color: '#3b82f6' }
      ],
      period: 'month',
      description: 'Monthly order volume trends',
      insights: [
        'Order volume increased by 27% in April',
        'February showed consistent growth',
        'March had a slight decline but recovered in April'
      ]
    },
    {
      id: '2',
      title: 'Revenue Distribution',
      type: 'pie',
      data: [
        { label: 'Printing', value: 45, category: 'services', color: '#10b981' },
        { label: 'Design', value: 25, category: 'services', color: '#f59e0b' },
        { label: 'Consulting', value: 20, category: 'services', color: '#8b5cf6' },
        { label: 'Other', value: 10, category: 'services', color: '#6b7280' }
      ],
      period: 'month',
      description: 'Revenue breakdown by service type'
    },
    {
      id: '3',
      title: 'Key Metrics',
      type: 'metric',
      data: [
        { label: 'Total Orders', value: 156, change: 15, changeType: 'increase', category: 'orders' },
        { label: 'Revenue', value: 12500, change: 8, changeType: 'increase', category: 'revenue' },
        { label: 'Customer Satisfaction', value: 4.8, change: -2, changeType: 'decrease', category: 'quality' }
      ],
      period: 'month'
    }
  ]);

  const [workflowActions] = useState<WorkflowAction[]>([
    {
      id: '1',
      title: 'Approve Order',
      description: 'Quickly approve pending orders',
      icon: '✓',
      shortcut: 'Ctrl+A',
      gesture: 'swipe-right',
      category: 'orders',
      priority: 'high',
      estimatedTime: '30s'
    },
    {
      id: '2',
      title: 'Assign Ticket',
      description: 'Assign support tickets to agents',
      icon: '👤',
      shortcut: 'Ctrl+T',
      gesture: 'swipe-left',
      category: 'tickets',
      priority: 'medium',
      estimatedTime: '1m'
    },
    {
      id: '3',
      title: 'Toggle Service',
      description: 'Enable/disable service availability',
      icon: '🔧',
      shortcut: 'Ctrl+S',
      gesture: 'double-tap',
      category: 'services',
      priority: 'low',
      estimatedTime: '15s'
    },
    {
      id: '4',
      title: 'Quick Reply',
      description: 'Send pre-written responses',
      icon: '💬',
      shortcut: 'Ctrl+R',
      gesture: 'swipe-up',
      category: 'quick',
      priority: 'medium',
      estimatedTime: '20s'
    }
  ]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handlePeriodChange = (chartId: string, period: ChartData['period']) => {
    console.log(`Chart ${chartId} period changed to ${period}`);
  };

  const handleExport = (chartId: string) => {
    console.log(`Exporting chart ${chartId}`);
  };

  const handleExecuteAction = (action: WorkflowAction) => {
    console.log(`Executing action: ${action.title}`);
  };

  const handleCustomizeShortcuts = () => {
    console.log('Opening shortcut customization');
  };

  return (
    <Container className="py-8 space-y-8">
      <div className="text-center">
        <Text variant="h1" size="4xl" weight="bold" className="text-brand-primary">
          Admin Components
        </Text>
        <Text variant="p" size="lg" color="muted" className="mt-4">
          Specialized components for admin dashboard functionality
        </Text>
      </div>

      {/* Notification Center */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <Text variant="h2" size="2xl" weight="semibold">Notification Center</Text>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">
              {notifications.filter(n => !n.read).length} unread
            </span>
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onDismiss={handleDismiss}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClearAll={handleClearAll}
            />
          </div>
        </div>
        
        <Card className="p-6">
          <Text variant="p" size="sm" color="muted" className="mb-4">
            Click the notification bell above to see the notification center in action.
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {notifications.slice(0, 3).map(notification => (
              <div key={notification.id} className="p-3 border border-neutral-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${
                    notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'warning' ? 'bg-orange-500' :
                    notification.type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <Text variant="p" size="sm" weight="medium">
                    {notification.title}
                  </Text>
                </div>
                <Text variant="p" size="xs" color="muted">
                  {notification.message}
                </Text>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" size="sm">
                    {notification.category}
                  </Badge>
                  <Badge variant={notification.priority === 'high' ? 'error' : 'secondary'} size="sm">
                    {notification.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Data Insights */}
      <section className="space-y-6">
        <Text variant="h2" size="2xl" weight="semibold">Data Insights</Text>
        <DataInsights
          charts={charts}
          onPeriodChange={handlePeriodChange}
          onExport={handleExport}
        />
      </section>

      {/* Mobile Workflow */}
      <section className="space-y-6">
        <Text variant="h2" size="2xl" weight="semibold">Mobile Workflow</Text>
        <MobileWorkflow
          actions={workflowActions}
          onExecuteAction={handleExecuteAction}
          onCustomizeShortcuts={handleCustomizeShortcuts}
        />
      </section>

      {/* Admin Settings Components */}
      <section className="space-y-6">
        <Text variant="h2" size="2xl" weight="semibold">Admin Settings Components</Text>
        
        <div className="space-y-6">
          {/* Admin Profile Card */}
          <AdminProfileCard
            initials="AU"
            data={{
              displayName: 'Admin User',
              email: 'admin@printy.com',
              role: 'admin',
              department: 'Operations',
              permissions: ['user_management', 'system_settings', 'reports'],
              lastLogin: '2024-01-15T10:30:00Z',
              avatarUrl: '',
            }}
          />

          {/* System Preferences */}
          <SystemPreferences
            value={{
              autoBackup: true,
              maintenanceMode: false,
              debugLogging: false,
              performanceMonitoring: true,
              dataRetention: '90_days',
            }}
            onUpdate={(updates) => console.log('System prefs updated:', updates)}
          />

          {/* User Management Settings */}
          <UserManagementSettings
            value={{
              autoApproval: false,
              requireEmailVerification: true,
              allowGuestAccess: true,
              maxLoginAttempts: 5,
              sessionTimeout: 30,
            }}
            onUpdate={(updates) => console.log('User mgmt updated:', updates)}
          />

          {/* Security Settings */}
          <SecuritySettings
            onPasswordUpdated={() => console.log('Password updated')}
          />

          {/* Notification Settings */}
          <NotificationSettings
            value={{
              systemAlerts: true,
              userReports: true,
              securityEvents: true,
              performanceIssues: true,
              maintenanceUpdates: true,
            }}
            onToggle={(key) => console.log('Notification toggled:', key)}
          />
        </div>
      </section>

      {/* Usage Examples */}
      <section className="space-y-6">
        <Text variant="h2" size="2xl" weight="semibold">Usage Examples</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <Text variant="h3" size="lg" weight="semibold" className="mb-3">
              Integration Example
            </Text>
            <Text variant="p" size="sm" color="muted" className="mb-4">
              These components can be integrated into your admin dashboard to provide:
            </Text>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>• Real-time notifications for important events</li>
              <li>• Interactive data visualization and insights</li>
              <li>• Mobile-optimized workflow shortcuts</li>
              <li>• Consistent admin experience across devices</li>
            </ul>
          </Card>
          
          <Card className="p-6">
            <Text variant="h3" size="lg" weight="semibold" className="mb-3">
              Customization
            </Text>
            <Text variant="p" size="sm" color="muted" className="mb-4">
              All components are fully customizable:
            </Text>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>• Modify colors, spacing, and typography</li>
              <li>• Add custom actions and workflows</li>
              <li>• Integrate with your data sources</li>
              <li>• Extend with additional features</li>
            </ul>
          </Card>
        </div>
      </section>
    </Container>
  );
};

export default AdminComponentsShowcase;
