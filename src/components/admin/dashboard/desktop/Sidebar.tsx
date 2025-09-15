import React from 'react';
import {
  Bot,
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Settings,
  LogOut,
} from 'lucide-react';
import { Tooltip, Button } from '../../../shared';

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
  const item = (id: AdminSidebarProps['active'], icon: React.ReactNode) => (
    <Button
      key={id}
      onClick={() => onNavigate(id)}
      variant={active === id ? 'primary' : 'ghost'}
      size="sm"
      threeD
      className="w-12 h-12 p-0 rounded-lg flex items-center justify-center"
      aria-current={active === id ? 'page' : undefined}
    >
      {icon}
    </Button>
  );

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-16 bg-white border-r border-neutral-200 flex flex-col items-center py-4 z-40">
      <Tooltip label="Admin">
        <div className="w-9 h-9 rounded-lg bg-brand-primary text-white flex items-center justify-center mb-5 shadow-sm">
          <Bot className="w-4 h-4" />
        </div>
      </Tooltip>

      <div className="flex-1 w-full space-y-2 px-2">
        <Tooltip label="Dashboard">
          {item('dashboard', <LayoutDashboard className="w-4 h-4" />)}
        </Tooltip>
        <Tooltip label="Orders">
          {item('orders', <ClipboardList className="w-4 h-4" />)}
        </Tooltip>
        <Tooltip label="Portfolio">
          {item('portfolio', <Wrench className="w-4 h-4" />)}
        </Tooltip>
      </div>

      <div className="mt-auto space-y-2 w-full px-2 pb-2">
        <Tooltip label="Settings">
          <Button
            onClick={() => onNavigate('settings')}
            variant="secondary"
            size="sm"
            threeD
            className="w-12 h-12 p-0 rounded-lg flex items-center justify-center"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </Tooltip>
        <Tooltip label="Logout">
          <Button
            onClick={onLogout}
            variant="accent"
            size="sm"
            threeD
            className="w-12 h-12 p-0 rounded-lg flex items-center justify-center"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    </aside>
  );
};

export default AdminSidebar;
