import React from 'react';
import { PortfolioDesktopCard, PortfolioMobileCard } from '@components/admin';

const AdminPortfolio: React.FC = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="lg:hidden mb-4">
        <PortfolioMobileCard />
      </div>
      <div className="hidden lg:block">
        <PortfolioDesktopCard />
      </div>
    </div>
  );
};

export default AdminPortfolio;
