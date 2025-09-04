import React from 'react';
import {
  Bot,
  Settings,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  Wrench,
} from 'lucide-react';
import { Button, Text } from '../shared';

export interface AdminDesktopSidebarProps {
  active: 'dashboard' | 'orders' | 'portfolio' | 'settings';
  onNavigate: (
    route: 'dashboard' | 'orders' | 'portfolio' | 'settings'
  ) => void;
  onLogout: () => void;
}

const AdminDesktopSidebar: React.FC<AdminDesktopSidebarProps> = ({
  active,
  onNavigate,
  onLogout,
}) => {
  const navItem = (
    id: AdminDesktopSidebarProps['active'],
    label: string,
    icon: React.ReactNode
  ) => (
    <button
      key={id}
      onClick={() => onNavigate(id)}
      className={
        'w-full text-left rounded-lg border px-3 py-3 transition-colors flex items-center gap-3 ' +
        (active === id
          ? 'bg-brand-primary-50 border-brand-primary'
          : 'bg-white border-neutral-200 hover:bg-neutral-50')
      }
      aria-current={active === id ? 'page' : undefined}
    >
      <div className="w-6 h-6 rounded-md bg-brand-primary text-white flex items-center justify-center text-xs">
        {icon}
      </div>
      <Text variant="h4" size="sm" weight="semibold" className="truncate">
        {label}
      </Text>
    </button>
  );

  return (
    <aside className="hidden lg:flex w-80 bg-white border-r border-neutral-200 flex-col">
      <div className="p-4 shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 w-10 rounded-lg bg-brand-primary text-white flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <Text
              variant="h3"
              size="lg"
              weight="bold"
              className="text-brand-primary"
            >
              Printy
            </Text>
            <Text variant="p" size="xs" color="muted">
              Admin Panel
            </Text>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4">
        <div className="space-y-2">
          {navItem(
            'dashboard',
            'Dashboard',
            <LayoutDashboard className="w-4 h-4" />
          )}
          {navItem('orders', 'Orders', <ClipboardList className="w-4 h-4" />)}
          {navItem('portfolio', 'Portfolio', <Wrench className="w-4 h-4" />)}
        </div>
      </div>

      <div className="p-4 border-t border-neutral-200 shrink-0">
        <div className="space-y-4">
          <Button
            variant="secondary"
            className="w-full justify-start"
            threeD
            onClick={() => onNavigate('settings')}
          >
            <Settings className="w-4 h-4 mr-2" /> Settings
          </Button>
          <Button
            variant="accent"
            className="w-full justify-start"
            threeD
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default AdminDesktopSidebar;
