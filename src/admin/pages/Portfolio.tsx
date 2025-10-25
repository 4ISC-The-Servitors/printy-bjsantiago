// Portfolio page now uses live Supabase data with realtime updates
import React from 'react';
import { PortfolioCard } from '@admin/components';

const AdminPortfolio: React.FC = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <PortfolioCard />
    </div>
  );
};

export default AdminPortfolio;
