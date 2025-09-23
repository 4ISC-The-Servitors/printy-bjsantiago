import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Text } from '../../../shared';
import {
  Home,
  Package,
  Ticket,
  BriefcaseBusiness,
  MessageSquare,
} from 'lucide-react';

interface MobileNavbarProps {
  onOpenChat: () => void;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ onOpenChat }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname === `${path}/`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-2 py-2 shadow-sm"
      aria-label="Admin navigation"
    >
      <div className="mx-auto max-w-screen-sm">
        <ul className="grid grid-cols-5 gap-1">
          <li>
            <Button
              variant="ghost"
              size="sm"
              className={`w-full flex flex-col items-center gap-1 min-h-[56px] ${
                isActive('/admin') ? 'text-blue-600' : 'text-gray-600'
              }`}
              aria-current={isActive('/admin') ? 'page' : undefined}
              aria-label="Home"
              onClick={() => navigate('/admin')}
            >
              <Home className="h-5 w-5" />
              <Text variant="p" size="xs">
                Home
              </Text>
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              size="sm"
              className={`w-full flex flex-col items-center gap-1 min-h-[56px] ${
                isActive('/admin/orders') ? 'text-blue-600' : 'text-gray-600'
              }`}
              aria-current={
                isActive('/admin/orders') ? 'page' : undefined
              }
              aria-label="Orders"
              onClick={() => navigate('/admin/orders')}
            >
              <Package className="h-5 w-5" />
              <Text variant="p" size="xs">
                Orders
              </Text>
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              size="sm"
              className={`w-full flex flex-col items-center gap-1 min-h-[56px] ${
                isActive('/admin/tickets') ? 'text-blue-600' : 'text-gray-600'
              }`}
              aria-current={
                isActive('/admin/tickets') ? 'page' : undefined
              }
              aria-label="Tickets"
              onClick={() => navigate('/admin/tickets')}
            >
              <Ticket className="h-5 w-5" />
              <Text variant="p" size="xs">
                Tickets
              </Text>
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              size="sm"
              className={`w-full flex flex-col items-center gap-1 min-h-[56px] ${
                isActive('/admin/portfolio') ? 'text-blue-600' : 'text-gray-600'
              }`}
              aria-current={
                isActive('/admin/portfolio') ? 'page' : undefined
              }
              aria-label="Portfolio"
              onClick={() => navigate('/admin/portfolio')}
            >
              <BriefcaseBusiness className="h-5 w-5" />
              <Text variant="p" size="xs">
                Portfolio
              </Text>
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex flex-col items-center gap-1 min-h-[56px] text-gray-600"
              aria-label="Printy"
              onClick={onOpenChat}
            >
              <MessageSquare className="h-5 w-5" />
              <Text variant="p" size="xs">
                Printy
              </Text>
            </Button>
          </li>
        </ul>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default MobileNavbar;


