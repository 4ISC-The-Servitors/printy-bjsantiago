import React, { useEffect, useState } from 'react';

// Import mobile components
import MobileOrdersCard from './mobile/OrdersCard';
import MobileTicketsCard from './mobile/TicketsCard';
import MobileSidebar from './mobile/Sidebar';

// Import desktop components
import DesktopOrdersCard from './desktop/OrdersCard';
import DesktopTicketsCard from './desktop/TicketsCard';
import DesktopSidebar from './desktop/Sidebar';

// Platform detection hook
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

// Responsive components that auto-switch
export const OrdersCard: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileOrdersCard /> : <DesktopOrdersCard />;
};

export const TicketsCard: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileTicketsCard /> : <DesktopTicketsCard />;
};

export const Sidebar: React.FC<{
  active: any;
  onNavigate: any;
  onLogout: any;
}> = props => {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MobileSidebar {...props} />
  ) : (
    <DesktopSidebar {...props} />
  );
};
