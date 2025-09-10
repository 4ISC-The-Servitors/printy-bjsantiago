import React, { useEffect, useState } from 'react';

// Import mobile components
import MobileServicePortfolioCard from './mobile/ServicePortfolioCard';

// Import desktop components
import DesktopServicePortfolioCard from './desktop/ServicePortfolioCard';

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

// Responsive component that auto-switches
export const ServicePortfolioCard: React.FC<{
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}> = props => {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MobileServicePortfolioCard {...props} />
  ) : (
    <DesktopServicePortfolioCard {...props} />
  );
};
