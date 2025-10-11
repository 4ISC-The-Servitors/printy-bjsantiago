// BACKEND_TODO: Ensure portfolio/services data comes from Supabase and updates realtime.
// Remove any reliance on `mockServices` and helper mappers once live.
import React from 'react';
import { PortfolioCard } from '@components/admin';

const AdminPortfolio: React.FC = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <PortfolioCard />
    </div>
  );
};

export default AdminPortfolio;
