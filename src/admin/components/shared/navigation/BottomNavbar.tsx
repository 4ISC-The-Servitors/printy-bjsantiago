import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Text } from '@admin/components/shared';
import {
  Home,
  Package,
  Ticket,
  BriefcaseBusiness,
  FileText,
} from 'lucide-react';

export type NavRoute =
  | 'dashboard'
  | 'orders'
  | 'tickets'
  | 'portfolio'
  | 'quotes';

export interface BottomNavbarProps {
  onNavigate: (route: NavRoute) => void;
}

/**
 * Bottom navigation bar for admin
 * Consistent across desktop and mobile
 * Contains: Dashboard, Orders, Tickets, Portfolio, Quotes
 * Chats, Settings & Logout are in the collapsible sidebar
 */
export const BottomNavbar: React.FC<BottomNavbarProps> = ({ onNavigate }) => {
  const location = useLocation();

  const getActiveRoute = (): NavRoute | null => {
    if (location.pathname === '/admin') return 'dashboard';
    if (location.pathname.startsWith('/admin/orders')) return 'orders';
    if (location.pathname.startsWith('/admin/tickets')) return 'tickets';
    if (location.pathname.startsWith('/admin/portfolio')) return 'portfolio';
    if (location.pathname.startsWith('/admin/quotes')) return 'quotes';
    return null;
  };

  const activeRoute = getActiveRoute();

  const navItems = [
    {
      id: 'dashboard' as NavRoute,
      label: 'Dashboard',
      icon: Home,
    },
    {
      id: 'orders' as NavRoute,
      label: 'Orders',
      icon: Package,
    },
    {
      id: 'tickets' as NavRoute,
      label: 'Tickets',
      icon: Ticket,
    },
    {
      id: 'quotes' as NavRoute,
      label: 'Quotes',
      icon: FileText,
    },
    {
      id: 'portfolio' as NavRoute,
      label: 'Portfolio',
      icon: BriefcaseBusiness,
    },
  ];

  return (
      <nav
      className="fixed bottom-0 left-0 right-0 lg:left-14 z-20 bg-white border-t border-neutral-200 shadow-sm"
      aria-label="Admin navigation"
    >
      <div className="mx-auto max-w-screen-xl px-2 md:px-6 lg:px-8 py-2 md:py-3">
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {navItems.map(item => {
            const isActive = activeRoute === item.id;
            const Icon = item.icon;

            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 md:gap-2 min-h-[48px] md:min-h-[56px] px-1 md:px-2 ${
                  isActive ? 'text-brand-primary' : 'text-neutral-600'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-brand-primary' : 'text-neutral-600'}`} />
                <Text variant="p" size="xs" className="text-center leading-tight hidden md:block">
                  {item.label}
                </Text>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Safe area for mobile notch */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default BottomNavbar;
