import React from 'react';
import {
  Bot,
  LucideHome,
  Package,
  BriefcaseBusiness,
  Ticket,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button, Text } from '../../../shared';

export interface AdminSidebarProps {
  active: 'dashboard' | 'orders' | 'portfolio' | 'settings';
  onNavigate: (
    route: 'dashboard' | 'orders' | 'portfolio' | 'settings'
  ) => void;
  onLogout: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  active,
  onNavigate,
  onLogout,
}) => {
  const item = (
    id: AdminSidebarProps['active'],
    icon: React.ReactNode,
    label: string
  ) => (
    <Button
      key={id}
      onClick={() => onNavigate(id)}
      variant={active === id ? 'primary' : 'ghost'}
      threeD
      className="w-full justify-start px-3 py-3"
      aria-current={active === id ? 'page' : undefined}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </Button>
  );

  return (
    <aside className="hidden lg:flex w-80 bg-white border-r border-neutral-200 flex-col">
      <div className="p-4 shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-brand-primary text-white flex items-center justify-center">
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
              B.J. Santiago Inc.
            </Text>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4">
        <div className="space-y-3">
          {item(
            'dashboard',
            <LucideHome className="w-4 h-4" />,
            'Dashboard'
          )}
          {item('orders', <Package className="w-4 h-4" />, 'Orders')}
          {item('tickets', <Ticket className="w-4 h-4" />, 'Tickets')}
          {item('portfolio', <BriefcaseBusiness className="w-4 h-4" />, 'Portfolio')}

        </div>
      </div>

      <div className="p-4 border-t border-neutral-200 shrink-0">
        <div className="space-y-4">
          <Button
            onClick={() => onNavigate('settings')}
            variant="secondary"
            className="w-full justify-start px-3 py-3"
            threeD
          >
            <Settings className="w-4 h-4 mr-2" /> Settings
          </Button>
          <Button
            onClick={onLogout}
            variant="accent"
            className="w-full justify-start px-3 py-3"
            threeD
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
