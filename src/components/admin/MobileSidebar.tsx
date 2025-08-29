import React from 'react';
import {
  Bot,
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Settings,
  LogOut,
} from 'lucide-react';

export interface AdminMobileSidebarProps {
  active: 'dashboard' | 'orders' | 'portfolio' | 'settings';
  onNavigate: (route: 'dashboard' | 'orders' | 'portfolio' | 'settings') => void;
  onLogout: () => void;
}

const AdminMobileSidebar: React.FC<AdminMobileSidebarProps> = ({
  active,
  onNavigate,
  onLogout,
}) => {
  const item = (
    id: AdminMobileSidebarProps['active'],
    icon: React.ReactNode,
    label: string
  ) => (
    <button
      key={id}
      onClick={() => onNavigate(id)}
      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
        active === id
          ? 'bg-brand-primary text-white'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
      }`}
      title={label}
      aria-current={active === id ? 'page' : undefined}
    >
      {icon}
    </button>
  );

  return (
    <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-16 bg-white border-r border-neutral-200 flex flex-col items-center py-4 z-40">
      <div className="w-9 h-9 rounded-lg bg-brand-primary text-white flex items-center justify-center mb-5 shadow-sm">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex-1 w-full space-y-2 px-2">
        {item(
          'dashboard',
          <LayoutDashboard className="w-4 h-4" />,
          'Dashboard'
        )}
        {item('orders', <ClipboardList className="w-4 h-4" />, 'Orders')}
        {item('services', <Wrench className="w-4 h-4" />, 'Services')}
      </div>

      <div className="mt-auto space-y-2 w-full px-2 pb-2">
        <button
          onClick={() => onNavigate('settings')}
          className="w-12 h-12 rounded-lg bg-neutral-200 text-neutral-700 hover:bg-neutral-300 flex items-center justify-center transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
        {/** If chat open, show close button style could be handled in header; keep logout here */}
        <button
          onClick={onLogout}
          className="w-12 h-12 rounded-lg bg-brand-accent text-white hover:bg-brand-accent/90 flex items-center justify-center transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default AdminMobileSidebar;
